import {
    WORLD_W,
    WORLD_H,
    QUARRY,
    LEVELS,
    LOADER_BUCKET_CAPACITY,
    SANDPILE_INTERACTION_DIST,
    INTERACTION_DIST,
    SCORE_PER_DUMP,
    SCORE_TRUCK_BONUS,
    SCORE_OVERLOAD_PENALTY,
    AREK_PENALTY_TIME,
    TEXT,
} from './utils/constants.js';
import {
    playScoopSound,
    playDumpSound,
    playWarningSound,
    playOverloadSound,
    playTruckHorn,
    playLevelUpSound,
} from './utils/audio.js';
import { pointDist, circleToAABBOverlap } from './physics.js';
import { Quarry } from './entities/quarry.js';
import { Loader } from './entities/loader.js';
import { Truck } from './entities/truck.js';
import { SandPile } from './entities/sandpile.js';
import { Arek } from './entities/arek.js';
import { HUD } from './ui/hud.js';
import { Menu } from './ui/menu.js';
import { Tutorial } from './ui/tutorial.js';

// ── State constants ────────────────────────────────────────────
const STATE_MENU      = 'MENU';
const STATE_PLAYING   = 'PLAYING';
const STATE_PAUSED    = 'PAUSED';
const STATE_GAME_OVER = 'GAME_OVER';
const STATE_LEVEL_UP  = 'LEVEL_UP';
const STATE_TUTORIAL  = 'TUTORIAL';

const LEVEL_UP_DURATION = 2.0; // seconds
const OVERLOAD_MSG_DURATION = 1.5; // seconds
const WARNING_DURATION = 2.0; // seconds

export class Game {
    constructor(canvas, input, renderer) {
        this.canvas = canvas;
        this.input = input;
        this.renderer = renderer;

        // World entities
        this.quarry = new Quarry();
        this.quarry.generateTerrain(Math.min(canvas.width / WORLD_W, canvas.height / WORLD_H));
        this.loader = new Loader(QUARRY.loaderStart.x, QUARRY.loaderStart.y);
        this.sandPiles = QUARRY.sandPiles.map(cfg => new SandPile(cfg));
        this.arek = new Arek();

        // UI
        this.hud = new HUD();
        this.menu = new Menu();
        this.tutorial = new Tutorial();

        // Game state
        this.state = STATE_MENU;
        this.score = 0;
        this.timeLeft = 0;
        this.level = 1;
        this.trucksLoaded = 0;
        this.trucks = [];
        this.currentTruckIndex = -1;

        // Timers
        this.overloadMessage = null;
        this.overloadTimer = 0;
        this.arekSpawnTimer = 0;
        this.levelUpTimer = 0;
        this.warningText = null;
        this.warningTimer = 0;

        // Trucks served this level
        this._trucksThisLevel = 0;
        this._trucksNeeded = 0;

        // High score
        this.highScore = 0;
        try {
            const stored = localStorage.getItem('gra01-highscore');
            if (stored) this.highScore = parseInt(stored, 10) || 0;
        } catch (e) { /* localStorage unavailable */ }
    }

    // ── UPDATE ─────────────────────────────────────────────────
    update(dt) {
        switch (this.state) {
            case STATE_TUTORIAL:
                if (this.input.consumeTap()) {
                    this.tutorial.advance();
                    if (this.tutorial.isDone()) {
                        this.state = STATE_PLAYING;
                    }
                }
                break;

            case STATE_MENU:
                if (this.input.consumeTap()) {
                    if (this.tutorial.isActive()) {
                        this._resetGame();
                        this.state = STATE_TUTORIAL;
                    } else {
                        this._resetGame();
                        this.state = STATE_PLAYING;
                    }
                }
                break;

            case STATE_PAUSED:
                if (this.input.consumeTap()) {
                    // Check rough button positions: resume is upper, restart is lower
                    // For simplicity, use action for resume, pause button for restart
                    this.state = STATE_PLAYING;
                }
                if (this.input.consumePause()) {
                    this.state = STATE_PLAYING;
                }
                break;

            case STATE_GAME_OVER:
                if (this.input.consumeTap()) {
                    this._resetGame();
                    this.state = STATE_PLAYING;
                }
                break;

            case STATE_LEVEL_UP:
                this.levelUpTimer -= dt;
                if (this.levelUpTimer <= 0) {
                    this.state = STATE_PLAYING;
                }
                break;

            case STATE_PLAYING:
                this._updatePlaying(dt);
                break;
        }
    }

    _updatePlaying(dt) {
        // 1. Pause button
        if (this.input.consumePause()) {
            this.state = STATE_PAUSED;
            return;
        }

        // 2. Update loader movement
        const joystick = this.input.getJoystick();
        this.loader.update(dt, joystick);

        // 3. Clamp loader to quarry bounds
        const clamped = this.quarry.clampToBounds(
            this.loader.x, this.loader.y,
            this.loader.width / 2, this.loader.height / 2,
        );
        this.loader.x = clamped.x;
        this.loader.y = clamped.y;

        // 4. Update sand piles
        for (const pile of this.sandPiles) {
            pile.update(dt);
        }

        // 5. Update trucks
        for (const truck of this.trucks) {
            truck.update(dt);
        }

        // 6. Update Arek
        this.arek.update(dt);

        // 7. Arek spawn timer
        const levelCfg = this._getLevelConfig();
        if (levelCfg.arekInterval > 0 && !this.arek.active) {
            this.arekSpawnTimer -= dt * 1000;
            if (this.arekSpawnTimer <= 0) {
                this.arek.spawn(this.quarry.bounds);
                playWarningSound();
                this.warningText = TEXT.arekWarning;
                this.warningTimer = WARNING_DURATION;
                this.arekSpawnTimer = levelCfg.arekInterval;
            }
        }

        // 8. Action button
        if (this.input.consumeAction()) {
            this._handleAction();
        }

        // 9. Check if current truck is full (only count once)
        const currentTruck = this._getCurrentTruck();
        if (currentTruck && currentTruck.isFull() && !currentTruck._bonusCounted) {
            currentTruck._bonusCounted = true;
            this.score += SCORE_TRUCK_BONUS;
            this.trucksLoaded++;
            this._trucksThisLevel++;
            playTruckHorn();
        }

        // 10. Check if truck departed → spawn next or advance level
        if (currentTruck && currentTruck.isGone()) {
            this.trucks.splice(this.currentTruckIndex, 1);
            this.currentTruckIndex = -1;

            if (this._trucksThisLevel >= this._trucksNeeded) {
                // Advance level
                this.level++;
                this.levelUpTimer = LEVEL_UP_DURATION;
                this.state = STATE_LEVEL_UP;
                playLevelUpSound();
                this.startLevel(this.level);
            } else {
                this.spawnTruck();
            }
        }

        // 11. Check Arek collision with loader
        if (this.arek.active && !this.arek.isShowingWarning()) {
            const arekBounds = this.arek.getBounds();
            const loaderBounds = this.loader.getBounds();
            if (circleToAABBOverlap(arekBounds, loaderBounds)) {
                this.loader.stun();
                this.timeLeft -= AREK_PENALTY_TIME;
                this.arek.deactivate();
                playWarningSound();
                this.warningText = TEXT.arekWarning;
                this.warningTimer = WARNING_DURATION;
            }
        }

        // 12. Decrease time
        this.timeLeft -= dt;
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.state = STATE_GAME_OVER;
            this._saveHighScore();
        }

        // 13. Decrease warning/overload timers
        if (this.overloadTimer > 0) {
            this.overloadTimer -= dt;
            if (this.overloadTimer <= 0) {
                this.overloadMessage = null;
                this.overloadTimer = 0;
            }
        }
        if (this.warningTimer > 0) {
            this.warningTimer -= dt;
            if (this.warningTimer <= 0) {
                this.warningText = null;
                this.warningTimer = 0;
            }
        }
    }

    _handleAction() {
        const action = this.determineActionLabel();
        if (!action || !action.enabled) return;

        if (action.label === TEXT.scoop) {
            // Find nearest pile that can be scooped
            for (const pile of this.sandPiles) {
                const dist = pointDist(this.loader.x, this.loader.y, pile.x, pile.y);
                if (dist < SANDPILE_INTERACTION_DIST && pile.canScoop()) {
                    pile.scoop(LOADER_BUCKET_CAPACITY);
                    this.loader.bucketLoad = LOADER_BUCKET_CAPACITY;
                    this.loader.startScoop();
                    playScoopSound();
                    break;
                }
            }
        } else if (action.label === TEXT.dump) {
            const truck = this._getCurrentTruck();
            if (truck) {
                const added = truck.addLoad(this.loader.bucketLoad);
                if (added > 0) {
                    this.loader.startDump();
                    this.score += SCORE_PER_DUMP;
                    playDumpSound();
                } else {
                    // Overload
                    this.overloadMessage = TEXT.overloaded;
                    this.overloadTimer = OVERLOAD_MSG_DURATION;
                    this.score += SCORE_OVERLOAD_PENALTY;
                    if (this.score < 0) this.score = 0;
                    playOverloadSound();
                }
            }
        }
    }

    // ── ACTION LABEL ───────────────────────────────────────────
    determineActionLabel() {
        // Check proximity to sand piles (bucket must be empty)
        if (this.loader.bucketState === 'EMPTY') {
            for (const pile of this.sandPiles) {
                const dist = pointDist(this.loader.x, this.loader.y, pile.x, pile.y);
                if (dist < SANDPILE_INTERACTION_DIST && pile.canScoop()) {
                    return { label: TEXT.scoop, enabled: true };
                }
            }
        }

        // Check proximity to truck (bucket must be full, truck must be waiting)
        if (this.loader.bucketState === 'FULL') {
            const truck = this._getCurrentTruck();
            if (truck && truck.state === 'WAITING') {
                const dist = pointDist(this.loader.x, this.loader.y, truck.x, truck.y);
                if (dist < INTERACTION_DIST + truck.width / 2) {
                    return { label: TEXT.dump, enabled: true };
                }
            }
        }

        return null;
    }

    // ── LEVEL MANAGEMENT ───────────────────────────────────────
    startLevel(levelNum) {
        const cfg = this._getLevelConfig(levelNum);
        this.timeLeft = cfg.time;
        this._trucksThisLevel = 0;
        this._trucksNeeded = cfg.trucks;
        this.arekSpawnTimer = cfg.arekInterval > 0 ? cfg.arekInterval : 999999;
        this.arek.deactivate();

        // Clear old trucks
        this.trucks = [];
        this.currentTruckIndex = -1;

        // Spawn first truck
        this.spawnTruck();
    }

    spawnTruck() {
        const cfg = this._getLevelConfig();
        const types = cfg.types;
        const typeKey = types[Math.floor(Math.random() * types.length)];
        const truck = new Truck(typeKey, QUARRY.truckWait, QUARRY.truckEntry, QUARRY.truckExit);
        this.trucks.push(truck);
        this.currentTruckIndex = this.trucks.length - 1;
    }

    // ── RENDER ─────────────────────────────────────────────────
    render() {
        const r = this.renderer;
        const ctx = r.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        r.clear();

        // Always render the world underneath
        r.renderTerrain(this.quarry);

        for (const pile of this.sandPiles) {
            r.renderSandPile(pile);
        }
        for (const truck of this.trucks) {
            r.renderTruck(truck);
        }
        r.renderLoader(this.loader);
        r.renderArek(this.arek);

        // Overlays depend on state
        switch (this.state) {
            case STATE_MENU:
                this.menu.renderMainMenu(ctx, w, h, this.highScore);
                break;

            case STATE_TUTORIAL:
                this.tutorial.render(ctx, w, h);
                break;

            case STATE_PLAYING: {
                // Joystick + action button
                r.renderJoystick(this.input);
                const action = this.determineActionLabel();
                if (action) {
                    r.renderActionButton(action.label, action.enabled);
                } else {
                    r.renderActionButton('---', false);
                }

                // HUD
                const gameState = {
                    score: this.score,
                    timeLeft: this.timeLeft,
                    level: this.level,
                    currentTruck: this._getCurrentTruck(),
                    overloadMessage: this.overloadMessage,
                };
                this.hud.render(ctx, gameState, r.scaleX, r.scaleY);

                // Warning text
                if (this.warningText && this.warningTimer > 0) {
                    const alpha = Math.min(1, this.warningTimer / 0.5);
                    r.renderWarning(this.warningText, alpha);
                }
                break;
            }

            case STATE_PAUSED:
                // Render HUD underneath
                this.hud.render(ctx, {
                    score: this.score,
                    timeLeft: this.timeLeft,
                    level: this.level,
                    currentTruck: this._getCurrentTruck(),
                    overloadMessage: null,
                }, r.scaleX, r.scaleY);
                this.menu.renderPause(ctx, w, h);
                break;

            case STATE_GAME_OVER:
                this.menu.renderGameOver(ctx, w, h, this.score, this.highScore, this.trucksLoaded);
                break;

            case STATE_LEVEL_UP: {
                // Render HUD underneath
                this.hud.render(ctx, {
                    score: this.score,
                    timeLeft: this.timeLeft,
                    level: this.level,
                    currentTruck: null,
                    overloadMessage: null,
                }, r.scaleX, r.scaleY);
                const alpha = Math.min(1, this.levelUpTimer / (LEVEL_UP_DURATION * 0.3));
                this.menu.renderLevelUp(ctx, w, h, this.level, alpha);
                break;
            }
        }
    }

    // ── HELPERS ──────────────────────────────────────────────
    _getCurrentTruck() {
        if (this.currentTruckIndex >= 0 && this.currentTruckIndex < this.trucks.length) {
            return this.trucks[this.currentTruckIndex];
        }
        return null;
    }

    _getLevelConfig(levelNum) {
        const lvl = (levelNum || this.level) - 1;
        return LEVELS[Math.min(lvl, LEVELS.length - 1)];
    }

    _resetGame() {
        this.score = 0;
        this.level = 1;
        this.trucksLoaded = 0;
        this.trucks = [];
        this.currentTruckIndex = -1;
        this.overloadMessage = null;
        this.overloadTimer = 0;
        this.warningText = null;
        this.warningTimer = 0;
        this.arek.deactivate();

        // Reset loader position
        this.loader = new Loader(QUARRY.loaderStart.x, QUARRY.loaderStart.y);

        // Reset sand piles
        this.sandPiles = QUARRY.sandPiles.map(cfg => new SandPile(cfg));

        // Start level 1
        this.startLevel(1);
    }

    _saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            try {
                localStorage.setItem('gra01-highscore', String(this.highScore));
            } catch (e) { /* localStorage unavailable */ }
        }
    }
}

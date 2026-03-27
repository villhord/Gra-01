import {
    WORLD_W,
    WORLD_H,
    QUARRY,
    LEVELS,
    BUCKET_FILL_RATE,
    BUCKET_MAX_TONS,
    SANDPILE_INTERACTION_DIST,
    INTERACTION_DIST,
    SCORE_PER_TON,
    SCORE_ACCURACY_BONUS,
    SCORE_TIME_BONUS_MAX,
    SCORE_TIME_WINDOW,
    SCORE_OVERLOAD_PENALTY,
    AREK_PENALTY_SCORE,
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

const LEVEL_UP_DURATION     = 2.0; // seconds
const OVERLOAD_MSG_DURATION = 1.5;
const WARNING_DURATION      = 2.0;

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
        this.level = 1;
        this.trucksLoaded = 0;
        this.trucks = [];
        this.currentTruckIndex = -1;

        // Timers / messages
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
                    if (this.tutorial.isDone()) this.state = STATE_PLAYING;
                }
                break;

            case STATE_MENU:
                if (this.input.consumeTap()) {
                    this._resetGame();
                    this.state = this.tutorial.isActive() ? STATE_TUTORIAL : STATE_PLAYING;
                }
                break;

            case STATE_PAUSED:
                if (this.input.consumeTap() || this.input.consumePause()) {
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
                if (this.levelUpTimer <= 0) this.state = STATE_PLAYING;
                break;

            case STATE_PLAYING:
                this._updatePlaying(dt);
                break;
        }
    }

    _updatePlaying(dt) {
        // 1. Pause
        if (this.input.consumePause()) { this.state = STATE_PAUSED; return; }

        // 2. Loader movement
        this.loader.update(dt, this.input.getJoystick());
        const clamped = this.quarry.clampToBounds(
            this.loader.x, this.loader.y,
            this.loader.width / 2, this.loader.height / 2,
        );
        this.loader.x = clamped.x;
        this.loader.y = clamped.y;

        // 3. Sand piles & trucks
        for (const pile of this.sandPiles) pile.update(dt);
        for (const truck of this.trucks) truck.update(dt);

        // 4. Arek spawn logic
        this.arek.update(dt);
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

        // 5. Hold-to-scoop: accumulate fillTons while button held near pile
        if (this.input.isActionHeld() && this.loader.bucketState === 'EMPTY') {
            const nearPile = this._getNearPile();
            if (nearPile) {
                this.loader.fillTons = Math.min(
                    this.loader.fillTons + BUCKET_FILL_RATE * dt,
                    BUCKET_MAX_TONS,
                );
            }
        }

        // 6. Action release → commit scoop
        if (this.input.consumeActionRelease()) {
            if (this.loader.bucketState === 'EMPTY') {
                const tons = Math.max(1, Math.round(this.loader.fillTons));
                const nearPile = this._getNearPile();
                if (nearPile && this.loader.fillTons > 0) {
                    nearPile.scoop(tons);
                    this.loader.startScoop(tons);
                    playScoopSound();
                }
                this.loader.fillTons = 0;
            }
        }

        // 7. Action press → horn / dump
        if (this.input.consumeAction()) {
            this._handleActionPress();
        }

        // 8. Check if current truck departed
        const currentTruck = this._getCurrentTruck();
        if (currentTruck && currentTruck.isGone()) {
            this.trucks.splice(this.currentTruckIndex, 1);
            this.currentTruckIndex = -1;

            if (this._trucksThisLevel >= this._trucksNeeded) {
                this.level++;
                if (this.level > LEVELS.length) {
                    // All levels complete
                    this.state = STATE_GAME_OVER;
                    this._saveHighScore();
                } else {
                    this.levelUpTimer = LEVEL_UP_DURATION;
                    this.state = STATE_LEVEL_UP;
                    playLevelUpSound();
                    this.startLevel(this.level);
                }
            } else {
                this.spawnTruck();
            }
        }

        // 9. Arek collision
        if (this.arek.active && !this.arek.isShowingWarning()) {
            if (circleToAABBOverlap(this.arek.getBounds(), this.loader.getBounds())) {
                this.loader.stun();
                this.score = Math.max(0, this.score - AREK_PENALTY_SCORE);
                this.arek.deactivate();
                playWarningSound();
                this.warningText = TEXT.arekWarning;
                this.warningTimer = WARNING_DURATION;
            }
        }

        // 10. Timers
        if (this.overloadTimer > 0) {
            this.overloadTimer -= dt;
            if (this.overloadTimer <= 0) { this.overloadMessage = null; this.overloadTimer = 0; }
        }
        if (this.warningTimer > 0) {
            this.warningTimer -= dt;
            if (this.warningTimer <= 0) { this.warningText = null; this.warningTimer = 0; }
        }
    }

    _handleActionPress() {
        const action = this.determineActionLabel();
        if (!action || !action.enabled) return;
        if (action.label === TEXT.scoop) return; // scoop handled by hold+release

        if (action.label === TEXT.horn) {
            const truck = this._getCurrentTruck();
            if (truck && truck.readyToSignal()) {
                this._scoreTruck(truck);
                this.trucksLoaded++;
                this._trucksThisLevel++;
                playTruckHorn();
                truck.signalDeparture();
            }
        } else if (action.label === TEXT.dump) {
            const truck = this._getCurrentTruck();
            if (truck) {
                const added = truck.addLoad(this.loader.bucketLoad);
                if (added > 0) {
                    this.loader.startDump();
                    playDumpSound();
                    if (truck.overloaded) {
                        this.overloadMessage = TEXT.overloaded;
                        this.overloadTimer = OVERLOAD_MSG_DURATION;
                        playOverloadSound();
                    }
                }
            }
        }
    }

    _scoreTruck(truck) {
        const tons = truck.currentLoad;
        const maxLoad = truck.maxLoad;

        // Base score: tons loaded (capped at maxLoad)
        let points = Math.min(tons, maxLoad) * SCORE_PER_TON;

        // Accuracy bonus: exact load (±1t, not overloaded)
        if (!truck.overloaded && Math.abs(tons - maxLoad) <= 1) {
            points += SCORE_ACCURACY_BONUS;
            this.warningText = TEXT.accuracy;
            this.warningTimer = WARNING_DURATION;
        }

        // Time bonus: faster = more bonus
        const elapsed = truck.loadingTimer;
        const timeFactor = Math.max(0, 1 - elapsed / SCORE_TIME_WINDOW);
        points += Math.round(SCORE_TIME_BONUS_MAX * timeFactor);

        // Overload penalty
        if (truck.overloaded) {
            points -= SCORE_OVERLOAD_PENALTY;
        }

        this.score = Math.max(0, this.score + points);
        this._saveHighScore();
    }

    // ── ACTION LABEL ───────────────────────────────────────────
    determineActionLabel() {
        const truck = this._getCurrentTruck();

        // Priority 1: truck at max load → horn
        if (truck && truck.readyToSignal()) {
            return { label: TEXT.horn, enabled: true };
        }

        // Priority 2: bucket empty near sand pile → scoop
        if (this.loader.bucketState === 'EMPTY') {
            if (this._getNearPile()) {
                return { label: TEXT.scoop, enabled: true };
            }
        }

        // Priority 3: bucket full near waiting truck → dump
        if (this.loader.bucketState === 'FULL') {
            if (truck && truck.state === 'WAITING') {
                const dist = pointDist(this.loader.x, this.loader.y, truck.x, truck.y);
                if (dist < INTERACTION_DIST + truck.width / 2) {
                    return { label: TEXT.dump, enabled: true };
                }
            }
        }

        return null;
    }

    _getNearPile() {
        for (const pile of this.sandPiles) {
            const dist = pointDist(this.loader.x, this.loader.y, pile.x, pile.y);
            if (dist < SANDPILE_INTERACTION_DIST && pile.canScoop()) return pile;
        }
        return null;
    }

    // ── LEVEL MANAGEMENT ───────────────────────────────────────
    startLevel(levelNum) {
        const cfg = this._getLevelConfig(levelNum);
        this._trucksThisLevel = 0;
        this._trucksNeeded = cfg.trucks;
        this.arekSpawnTimer = cfg.arekInterval > 0 ? cfg.arekInterval : 999999;
        this.arek.deactivate();
        this.trucks = [];
        this.currentTruckIndex = -1;
        this.spawnTruck();
    }

    spawnTruck() {
        const cfg = this._getLevelConfig();
        const typeKey = cfg.types[Math.floor(Math.random() * cfg.types.length)];
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
        r.renderTerrain(this.quarry);
        for (const pile of this.sandPiles) r.renderSandPile(pile);
        for (const truck of this.trucks) r.renderTruck(truck);
        r.renderLoader(this.loader);
        r.renderArek(this.arek);

        switch (this.state) {
            case STATE_MENU:
                this.menu.renderMainMenu(ctx, w, h, this.highScore);
                break;

            case STATE_TUTORIAL:
                this.tutorial.render(ctx, w, h);
                break;

            case STATE_PLAYING: {
                r.renderJoystick(this.input);
                const action = this.determineActionLabel();
                r.renderActionButton(
                    action ? action.label : '---',
                    action ? action.enabled : false,
                    this.loader.fillTons,
                );
                const truck = this._getCurrentTruck();
                if (truck && truck.state === 'WAITING') {
                    r.renderSpeechBubble(truck);
                }
                const gameState = {
                    score: this.score,
                    level: this.level,
                    currentTruck: truck,
                    trucksLoaded: this._trucksThisLevel,
                    trucksNeeded: this._trucksNeeded,
                    overloadMessage: this.overloadMessage,
                };
                this.hud.render(ctx, gameState, r.scaleX, r.scaleY);
                if (this.warningText && this.warningTimer > 0) {
                    const alpha = Math.min(1, this.warningTimer / 0.5);
                    r.renderWarning(this.warningText, alpha);
                }
                break;
            }

            case STATE_PAUSED:
                this.hud.render(ctx, {
                    score: this.score,
                    level: this.level,
                    currentTruck: this._getCurrentTruck(),
                    trucksLoaded: this._trucksThisLevel,
                    trucksNeeded: this._trucksNeeded,
                    overloadMessage: null,
                }, r.scaleX, r.scaleY);
                this.menu.renderPause(ctx, w, h);
                break;

            case STATE_GAME_OVER:
                this.menu.renderGameOver(ctx, w, h, this.score, this.highScore, this.trucksLoaded);
                break;

            case STATE_LEVEL_UP: {
                this.hud.render(ctx, {
                    score: this.score,
                    level: this.level,
                    currentTruck: null,
                    trucksLoaded: this._trucksThisLevel,
                    trucksNeeded: this._trucksNeeded,
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
        this.loader = new Loader(QUARRY.loaderStart.x, QUARRY.loaderStart.y);
        this.sandPiles = QUARRY.sandPiles.map(cfg => new SandPile(cfg));
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

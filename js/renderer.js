import {
    COLORS,
    WORLD_W,
    WORLD_H,
    LOADER_W,
    LOADER_H,
    BUCKET_MAX_TONS,
    TEXT,
} from './utils/constants.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    get scaleX() { return this.canvas.width / WORLD_W; }
    get scaleY() { return this.canvas.height / WORLD_H; }

    _sx(v) { return v * this.scaleX; }
    _sy(v) { return v * this.scaleY; }

    // ── core ─────────────────────────────────────────────────
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // ── terrain ──────────────────────────────────────────────
    renderTerrain(quarry) {
        if (!quarry.terrainCanvas) return;
        this.ctx.drawImage(quarry.terrainCanvas, 0, 0, this.canvas.width, this.canvas.height);
    }

    // ── sand pile ────────────────────────────────────────────
    renderSandPile(pile) {
        const ctx = this.ctx;
        const cx = this._sx(pile.x);
        const cy = this._sy(pile.y);
        const r  = this._sx(pile.currentRadius);
        if (r < 1) return;

        ctx.fillStyle = COLORS.sandDark;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = COLORS.sand;
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.15, r * 0.85, 0, Math.PI * 2);
        ctx.fill();

        for (const s of pile.stones) {
            const sx = cx + this._sx(s.x) * (pile.currentRadius / pile.baseRadius);
            const sy = cy + this._sy(s.y) * (pile.currentRadius / pile.baseRadius);
            const sr = Math.max(1, this._sx(s.size) * 0.5);
            ctx.fillStyle = COLORS.stone;
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ── loader (Volvo L-series top view) ─────────────────────
    renderLoader(loader) {
        const ctx = this.ctx;
        const x = this._sx(loader.x);
        const y = this._sy(loader.y);
        const w = this._sx(LOADER_W);
        const h = this._sy(LOADER_H);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(loader.angle);

        // ── Rear body / counterweight (left/back) ──
        const rearW = w * 0.48;
        const rearH = h;
        ctx.fillStyle = COLORS.loaderBody;
        ctx.fillRect(-w / 2, -rearH / 2, rearW, rearH);

        // Cab detail on rear body (darker stripe)
        const cabStripeW = rearW * 0.38;
        ctx.fillStyle = COLORS.loaderCab;
        ctx.fillRect(-w / 2, -rearH / 2, cabStripeW, rearH);

        // Rear window / glass on cab
        const glassW = cabStripeW * 0.55;
        const glassH = rearH * 0.5;
        ctx.fillStyle = COLORS.truckWindshield;
        ctx.fillRect(-w / 2 + cabStripeW * 0.2, -glassH / 2, glassW, glassH);

        // ── Articulation joint (pinch in middle) ──
        const artX   = -w / 2 + rearW;
        const artW   = w * 0.12;
        const artH   = h * 0.5;
        ctx.fillStyle = COLORS.loaderArticulation;
        ctx.fillRect(artX, -artH / 2, artW, artH);

        // ── Front frame (narrower) ──
        const frontX = artX + artW;
        const frontW = w * 0.24;
        const frontH = h * 0.78;
        ctx.fillStyle = COLORS.loaderBody;
        ctx.fillRect(frontX, -frontH / 2, frontW, frontH);

        // Boom arms on sides of front frame (dark lines)
        const armThick = this._sy(3);
        ctx.fillStyle = COLORS.loaderArm;
        ctx.fillRect(frontX, -frontH / 2, frontW, armThick);
        ctx.fillRect(frontX, frontH / 2 - armThick, frontW, armThick);

        // ── Bucket (trapezoid at front) ──
        const bkX     = frontX + frontW;
        const bkDepth = w * 0.18;
        const bkBackH = frontH;
        const bkFrontH = frontH * 1.2;
        ctx.beginPath();
        ctx.moveTo(bkX,            -bkBackH / 2);
        ctx.lineTo(bkX + bkDepth,  -bkFrontH / 2);
        ctx.lineTo(bkX + bkDepth,   bkFrontH / 2);
        ctx.lineTo(bkX,             bkBackH / 2);
        ctx.closePath();
        ctx.fillStyle = COLORS.loaderBucket;
        ctx.fill();

        // Sand in bucket when FULL
        if (loader.bucketState === 'FULL') {
            ctx.beginPath();
            ctx.moveTo(bkX + 2,            -bkBackH / 2 + 3);
            ctx.lineTo(bkX + bkDepth - 2,  -bkFrontH / 2 + 3);
            ctx.lineTo(bkX + bkDepth - 2,   bkFrontH / 2 - 3);
            ctx.lineTo(bkX + 2,             bkBackH / 2 - 3);
            ctx.closePath();
            ctx.fillStyle = COLORS.sand;
            ctx.fill();
        }

        // ── Wheels (4 corner rectangles) ──
        const wheelW = w * 0.12;
        const wheelH = h * 0.24;
        ctx.fillStyle = COLORS.loaderWheel;
        // Rear pair
        ctx.fillRect(-w / 2 + 2,           -h / 2 - wheelH / 2, wheelW, wheelH);
        ctx.fillRect(-w / 2 + 2,            h / 2 - wheelH / 2, wheelW, wheelH);
        // Front pair
        ctx.fillRect(frontX + frontW * 0.1, -h / 2 - wheelH / 2, wheelW, wheelH);
        ctx.fillRect(frontX + frontW * 0.1,  h / 2 - wheelH / 2, wheelW, wheelH);

        ctx.restore();
    }

    // ── truck ────────────────────────────────────────────────
    renderTruck(truck) {
        const ctx = this.ctx;
        const x = this._sx(truck.x);
        const y = this._sy(truck.y);
        const w = this._sx(truck.width);
        const h = this._sy(truck.height);
        const typeInfo = truck.type;
        const isPatelnia = truck.typeKey === 'patelnia';

        ctx.save();
        ctx.translate(x, y);

        if (isPatelnia) {
            // ── Patelnia: tractor (left/front) + gap + trailer (right/rear) ──
            const tractorW = w * 0.3;
            const gapW     = w * 0.04;
            const trailerW = w - tractorW - gapW;
            const tractorX = -w / 2;

            // Tractor
            ctx.fillStyle = typeInfo.color;
            ctx.fillRect(tractorX, -h / 2, tractorW, h);

            // Cab
            const cabW = tractorW * 0.55;
            ctx.fillStyle = COLORS.truckCab;
            ctx.fillRect(tractorX, -h / 2, cabW, h);

            // Windshield
            const wsW = cabW * 0.35;
            const wsH = h * 0.55;
            ctx.fillStyle = COLORS.truckWindshield;
            ctx.fillRect(tractorX + 2, -wsH / 2, wsW, wsH);

            // Trailer
            const trailerX = -w / 2 + tractorW + gapW;
            ctx.fillStyle = typeInfo.color;
            ctx.fillRect(trailerX, -h / 2, trailerW, h);

            const cargoMargin = 3;
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1;
            ctx.strokeRect(trailerX + cargoMargin, -h / 2 + cargoMargin, trailerW - cargoMargin * 2, h - cargoMargin * 2);

            const loadPct = truck.getLoadPercent();
            if (loadPct > 0) {
                ctx.fillStyle = truck.overloaded ? COLORS.warning : COLORS.truckCargo;
                ctx.fillRect(
                    trailerX + cargoMargin + 1,
                    -h / 2 + cargoMargin + 1,
                    (trailerW - cargoMargin * 2 - 2) * loadPct,
                    h - cargoMargin * 2 - 2,
                );
            }

            // Axles
            ctx.strokeStyle = COLORS.loaderWheel;
            ctx.lineWidth = this._sy(3);
            for (let i = 0; i < 2; i++) {
                const ax = tractorX + (tractorW * (i + 1)) / 3;
                ctx.beginPath(); ctx.moveTo(ax, -h / 2 - 2); ctx.lineTo(ax, h / 2 + 2); ctx.stroke();
            }
            for (let i = 0; i < 3; i++) {
                const ax = trailerX + (trailerW * (i + 1)) / 4;
                ctx.beginPath(); ctx.moveTo(ax, -h / 2 - 2); ctx.lineTo(ax, h / 2 + 2); ctx.stroke();
            }
        } else {
            // ── Regular truck (3-osio, 4-osio) ──
            ctx.fillStyle = typeInfo.color;
            ctx.fillRect(-w / 2, -h / 2, w, h);

            const cabW = w * 0.28;
            ctx.fillStyle = COLORS.truckCab;
            ctx.fillRect(-w / 2, -h / 2, cabW, h);

            const wsW = cabW * 0.4;
            const wsH = h * 0.55;
            ctx.fillStyle = COLORS.truckWindshield;
            ctx.fillRect(-w / 2 + 2, -wsH / 2, wsW, wsH);

            const cargoW      = w - cabW - 6;
            const cargoMargin = 3;
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1;
            ctx.strokeRect(-w / 2 + cabW + 3, -h / 2 + cargoMargin, cargoW, h - cargoMargin * 2);

            const loadPct = truck.getLoadPercent();
            if (loadPct > 0) {
                ctx.fillStyle = truck.overloaded ? COLORS.warning : COLORS.truckCargo;
                ctx.fillRect(
                    -w / 2 + cabW + 4,
                    -h / 2 + cargoMargin + 1,
                    (cargoW - 2) * loadPct,
                    h - cargoMargin * 2 - 2,
                );
            }

            ctx.strokeStyle = COLORS.loaderWheel;
            ctx.lineWidth = this._sy(3);
            for (let i = 0; i < typeInfo.axles; i++) {
                const ax = -w / 2 + (w * (i + 1)) / (typeInfo.axles + 1);
                ctx.beginPath(); ctx.moveTo(ax, -h / 2 - 2); ctx.lineTo(ax, h / 2 + 2); ctx.stroke();
            }
        }

        ctx.restore();
    }

    // ── speech bubble from truck cab ─────────────────────────
    renderSpeechBubble(truck) {
        if (truck.currentLoad > 0) return; // only show when empty/waiting
        const ctx = this.ctx;
        const tx = this._sx(truck.x);
        const ty = this._sy(truck.y);
        const tw = this._sx(truck.width);
        const th = this._sy(truck.height);

        // Position bubble above truck, near cab (left side)
        const bubCx = tx - tw * 0.25;
        const bubCy = ty - th / 2 - this._sy(32);

        const text = TEXT.speech;
        const fontSize = Math.round(this._sy(13));
        ctx.font = `${fontSize}px sans-serif`;
        const textW = ctx.measureText(text).width;
        const pad = this._sx(8);
        const bw  = textW + pad * 2;
        const bh  = fontSize * 1.8;
        const bx  = bubCx - bw / 2;
        const bby = bubCy - bh / 2;
        const rad = 6;

        // Rounded rect bubble
        ctx.fillStyle = COLORS.speechBg;
        ctx.beginPath();
        ctx.moveTo(bx + rad, bby);
        ctx.lineTo(bx + bw - rad, bby);
        ctx.quadraticCurveTo(bx + bw, bby, bx + bw, bby + rad);
        ctx.lineTo(bx + bw, bby + bh - rad);
        ctx.quadraticCurveTo(bx + bw, bby + bh, bx + bw - rad, bby + bh);
        ctx.lineTo(bx + rad, bby + bh);
        ctx.quadraticCurveTo(bx, bby + bh, bx, bby + bh - rad);
        ctx.lineTo(bx, bby + rad);
        ctx.quadraticCurveTo(bx, bby, bx + rad, bby);
        ctx.closePath();
        ctx.fill();

        // Tail pointing down toward truck
        ctx.beginPath();
        ctx.moveTo(bubCx - 5, bby + bh);
        ctx.lineTo(bubCx + 5, bby + bh);
        ctx.lineTo(bubCx, bby + bh + this._sy(8));
        ctx.closePath();
        ctx.fill();

        // Text
        ctx.fillStyle = COLORS.speechText;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, bubCx, bubCy);
    }

    // ── Arek ─────────────────────────────────────────────────
    renderArek(arek) {
        if (!arek.active) return;

        const ctx = this.ctx;
        const x = this._sx(arek.x);
        const y = this._sy(arek.y);
        const r = this._sx(arek.radius);

        const headR = r * 0.35;
        const bodyW = r * 0.5;
        const bodyH = r * 0.6;
        const legW  = bodyW * 0.35;
        const legH  = r * 0.35;

        ctx.fillStyle = COLORS.arekPants;
        ctx.fillRect(x - bodyW / 2,       y + bodyH / 2, legW, legH);
        ctx.fillRect(x + bodyW / 2 - legW, y + bodyH / 2, legW, legH);

        ctx.fillStyle = COLORS.arekVest;
        ctx.fillRect(x - bodyW / 2, y - bodyH / 2, bodyW, bodyH);

        const stripeH = bodyH * 0.18;
        ctx.fillStyle = COLORS.arekVestStripe;
        ctx.fillRect(x - bodyW / 2, y + bodyH * 0.1, bodyW, stripeH);

        ctx.fillStyle = COLORS.arekSkin;
        ctx.beginPath();
        ctx.arc(x, y - bodyH / 2 - headR, headR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = COLORS.arekHelmet;
        ctx.beginPath();
        ctx.arc(x, y - bodyH / 2 - headR, headR + 2, Math.PI, 0);
        ctx.fill();
    }

    // ── joystick ─────────────────────────────────────────────
    renderJoystick(input) {
        const ctx = this.ctx;
        const outerR = this._sx(55);
        const innerR = this._sx(24);
        const hintX  = this._sx(120);
        const hintY  = this.canvas.height - this._sy(110);

        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hintX, hintY, outerR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.arc(hintX, hintY, innerR, 0, Math.PI * 2);
        ctx.fill();

        if (!input || !input.joystick || !input.joystick.active) return;

        const j = input.joystick;
        ctx.strokeStyle = COLORS.joystickBase;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(j.startX, j.startY, outerR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = COLORS.joystickBase;
        ctx.beginPath();
        ctx.arc(j.startX, j.startY, outerR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = COLORS.joystickThumb;
        ctx.beginPath();
        ctx.arc(j.currentX, j.currentY, innerR, 0, Math.PI * 2);
        ctx.fill();
    }

    // ── action button ────────────────────────────────────────
    renderActionButton(label, enabled, fillTons = 0) {
        const ctx = this.ctx;
        const btnW  = this._sx(200);
        const btnH  = this._sy(90);
        const margin = this._sx(24);
        const bx    = this.canvas.width - btnW - margin;
        const by    = this.canvas.height - btnH - margin;
        const radius = this._sx(16);

        // Background
        ctx.fillStyle = enabled ? COLORS.actionButton : COLORS.actionButtonDisabled;
        ctx.beginPath();
        ctx.moveTo(bx + radius, by);
        ctx.lineTo(bx + btnW - radius, by);
        ctx.quadraticCurveTo(bx + btnW, by, bx + btnW, by + radius);
        ctx.lineTo(bx + btnW, by + btnH - radius);
        ctx.quadraticCurveTo(bx + btnW, by + btnH, bx + btnW - radius, by + btnH);
        ctx.lineTo(bx + radius, by + btnH);
        ctx.quadraticCurveTo(bx, by + btnH, bx, by + btnH - radius);
        ctx.lineTo(bx, by + radius);
        ctx.quadraticCurveTo(bx, by, bx + radius, by);
        ctx.closePath();
        ctx.fill();

        // Label
        ctx.fillStyle = COLORS.buttonText;
        ctx.font = `bold ${Math.round(this._sy(28))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, bx + btnW / 2, by + btnH / 2);

        // Fill progress bar when scooping (hold mechanic)
        if (fillTons > 0 && label === TEXT.scoop) {
            const barPad  = this._sx(8);
            const barH    = this._sy(8);
            const barY    = by + btnH - barH - this._sy(6);
            const barW    = btnW - barPad * 2;
            const fillPct = fillTons / BUCKET_MAX_TONS;

            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(bx + barPad, barY, barW, barH);

            ctx.fillStyle = COLORS.actionButtonHold;
            ctx.fillRect(bx + barPad, barY, barW * fillPct, barH);

            // Ton counter inside button
            const tStr = `${Math.round(fillTons)}t`;
            ctx.fillStyle = COLORS.buttonText;
            ctx.font = `bold ${Math.round(this._sy(20))}px sans-serif`;
            ctx.textAlign = 'right';
            ctx.fillText(tStr, bx + btnW - barPad, by + btnH * 0.38);
        }
    }

    // ── warning text ─────────────────────────────────────────
    renderWarning(text, alpha) {
        if (alpha <= 0) return;
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = alpha;

        const fontSize = Math.round(this._sy(72));
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = this._sx(6);
        ctx.lineJoin = 'round';
        ctx.strokeText(text, cx, cy);

        ctx.fillStyle = COLORS.warning;
        ctx.fillText(text, cx, cy);

        ctx.restore();
    }
}

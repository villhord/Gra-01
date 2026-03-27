import {
    COLORS,
    WORLD_W,
    WORLD_H,
    LOADER_W,
    LOADER_H,
} from './utils/constants.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    get scaleX() {
        return this.canvas.width / WORLD_W;
    }

    get scaleY() {
        return this.canvas.height / WORLD_H;
    }

    // ── helpers ──────────────────────────────────────────────
    _sx(v) { return v * this.scaleX; }
    _sy(v) { return v * this.scaleY; }

    // ── core ─────────────────────────────────────────────────
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // ── terrain ──────────────────────────────────────────────
    renderTerrain(quarry) {
        if (!quarry.terrainCanvas) return;
        this.ctx.drawImage(
            quarry.terrainCanvas,
            0, 0,
            this.canvas.width, this.canvas.height,
        );
    }

    // ── sand pile ────────────────────────────────────────────
    renderSandPile(pile) {
        const ctx = this.ctx;
        const cx = this._sx(pile.x);
        const cy = this._sy(pile.y);
        const r  = this._sx(pile.currentRadius);

        if (r < 1) return;

        // Larger base circle
        ctx.fillStyle = COLORS.sandDark;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Lighter overlapping circle offset upward
        ctx.fillStyle = COLORS.sand;
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.15, r * 0.85, 0, Math.PI * 2);
        ctx.fill();

        // Pre-generated stones
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

    // ── loader ───────────────────────────────────────────────
    renderLoader(loader) {
        const ctx = this.ctx;
        const x = this._sx(loader.x);
        const y = this._sy(loader.y);
        const w = this._sx(LOADER_W);
        const h = this._sy(LOADER_H);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(loader.angle);

        // Body
        ctx.fillStyle = COLORS.loaderBody;
        ctx.fillRect(-w / 2, -h / 2, w, h);

        // Cab (darker yellow, back portion)
        const cabW = w * 0.35;
        ctx.fillStyle = COLORS.loaderCab;
        ctx.fillRect(-w / 2, -h / 2, cabW, h);

        // Bucket at front (trapezoid)
        const bucketW = w * 0.18;
        const bucketFrontH = h * 1.1;
        const bucketBackH  = h * 0.8;
        ctx.beginPath();
        ctx.moveTo(w / 2,             -bucketBackH / 2);
        ctx.lineTo(w / 2 + bucketW,   -bucketFrontH / 2);
        ctx.lineTo(w / 2 + bucketW,    bucketFrontH / 2);
        ctx.lineTo(w / 2,              bucketBackH / 2);
        ctx.closePath();
        ctx.fillStyle = COLORS.loaderBucket;
        ctx.fill();

        // Fill bucket with sand when FULL
        if (loader.bucketState === 'FULL') {
            ctx.beginPath();
            ctx.moveTo(w / 2 + 2,               -bucketBackH / 2 + 3);
            ctx.lineTo(w / 2 + bucketW - 2,     -bucketFrontH / 2 + 3);
            ctx.lineTo(w / 2 + bucketW - 2,      bucketFrontH / 2 - 3);
            ctx.lineTo(w / 2 + 2,                bucketBackH / 2 - 3);
            ctx.closePath();
            ctx.fillStyle = COLORS.sand;
            ctx.fill();
        }

        // Wheels (4 small dark rectangles at corners)
        const wheelW = w * 0.14;
        const wheelH = h * 0.22;
        ctx.fillStyle = COLORS.loaderWheel;

        // Front-left
        ctx.fillRect(w / 2 - wheelW - 2, -h / 2 - wheelH / 2, wheelW, wheelH);
        // Front-right
        ctx.fillRect(w / 2 - wheelW - 2,  h / 2 - wheelH / 2, wheelW, wheelH);
        // Rear-left
        ctx.fillRect(-w / 2 + 2,          -h / 2 - wheelH / 2, wheelW, wheelH);
        // Rear-right
        ctx.fillRect(-w / 2 + 2,           h / 2 - wheelH / 2, wheelW, wheelH);

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

        // Trucks move LEFT — cab is on the LEFT side (front)

        if (isPatelnia) {
            // ── Patelnia: tractor (left/front) + gap + trailer (right/rear) ──
            const tractorW = w * 0.3;
            const gapW = w * 0.04;
            const trailerW = w - tractorW - gapW;

            // Tractor — LEFT portion (front)
            const tractorX = -w / 2;
            ctx.fillStyle = typeInfo.color;
            ctx.fillRect(tractorX, -h / 2, tractorW, h);

            // Cab on the tractor (left end — front)
            const cabW = tractorW * 0.55;
            ctx.fillStyle = COLORS.truckCab;
            ctx.fillRect(tractorX, -h / 2, cabW, h);

            // Windshield at left end
            const wsW = cabW * 0.35;
            const wsH = h * 0.55;
            ctx.fillStyle = COLORS.truckWindshield;
            ctx.fillRect(tractorX + 2, -wsH / 2, wsW, wsH);

            // Trailer (cargo) — RIGHT portion (rear)
            const trailerX = -w / 2 + tractorW + gapW;
            ctx.fillStyle = typeInfo.color;
            ctx.fillRect(trailerX, -h / 2, trailerW, h);

            // Cargo bed outline on trailer
            const cargoMargin = 3;
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1;
            ctx.strokeRect(
                trailerX + cargoMargin,
                -h / 2 + cargoMargin,
                trailerW - cargoMargin * 2,
                h - cargoMargin * 2,
            );

            // Sand fill proportional to load
            const loadPct = truck.getLoadPercent();
            if (loadPct > 0) {
                ctx.fillStyle = COLORS.truckCargo;
                ctx.fillRect(
                    trailerX + cargoMargin + 1,
                    -h / 2 + cargoMargin + 1,
                    (trailerW - cargoMargin * 2 - 2) * loadPct,
                    h - cargoMargin * 2 - 2,
                );
            }

            // Axles: 2 on tractor, 3 on trailer
            ctx.strokeStyle = COLORS.loaderWheel;
            ctx.lineWidth = this._sy(3);
            const tractorAxles = 2;
            for (let i = 0; i < tractorAxles; i++) {
                const ax = tractorX + (tractorW * (i + 1)) / (tractorAxles + 1);
                ctx.beginPath();
                ctx.moveTo(ax, -h / 2 - 2);
                ctx.lineTo(ax,  h / 2 + 2);
                ctx.stroke();
            }
            const trailerAxles = 3;
            for (let i = 0; i < trailerAxles; i++) {
                const ax = trailerX + (trailerW * (i + 1)) / (trailerAxles + 1);
                ctx.beginPath();
                ctx.moveTo(ax, -h / 2 - 2);
                ctx.lineTo(ax,  h / 2 + 2);
                ctx.stroke();
            }
        } else {
            // ── Regular truck (3-osio, 4-osio) ──

            // Body
            ctx.fillStyle = typeInfo.color;
            ctx.fillRect(-w / 2, -h / 2, w, h);

            // Cab at LEFT side (front — truck moves left)
            const cabW = w * 0.28;
            ctx.fillStyle = COLORS.truckCab;
            ctx.fillRect(-w / 2, -h / 2, cabW, h);

            // Windshield at left end
            const wsW = cabW * 0.4;
            const wsH = h * 0.55;
            ctx.fillStyle = COLORS.truckWindshield;
            ctx.fillRect(-w / 2 + 2, -wsH / 2, wsW, wsH);

            // Cargo bed (outline) — RIGHT portion excluding cab
            const cargoW = w - cabW - 6;
            const cargoMargin = 3;
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1;
            ctx.strokeRect(
                -w / 2 + cabW + 3,
                -h / 2 + cargoMargin,
                cargoW,
                h - cargoMargin * 2,
            );

            // Sand fill proportional to load
            const loadPct = truck.getLoadPercent();
            if (loadPct > 0) {
                ctx.fillStyle = COLORS.truckCargo;
                ctx.fillRect(
                    -w / 2 + cabW + 4,
                    -h / 2 + cargoMargin + 1,
                    (cargoW - 2) * loadPct,
                    h - cargoMargin * 2 - 2,
                );
            }

            // Axles
            const axleCount = typeInfo.axles;
            ctx.strokeStyle = COLORS.loaderWheel;
            ctx.lineWidth = this._sy(3);
            for (let i = 0; i < axleCount; i++) {
                const ax = -w / 2 + (w * (i + 1)) / (axleCount + 1);
                ctx.beginPath();
                ctx.moveTo(ax, -h / 2 - 2);
                ctx.lineTo(ax,  h / 2 + 2);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    // ── Arek ─────────────────────────────────────────────────
    renderArek(arek) {
        if (!arek.active) return;

        const ctx = this.ctx;
        const x = this._sx(arek.x);
        const y = this._sy(arek.y);
        const r = this._sx(arek.radius);

        const headR   = r * 0.35;
        const bodyW   = r * 0.5;
        const bodyH   = r * 0.6;
        const legW    = bodyW * 0.35;
        const legH    = r * 0.35;

        // Legs (dark)
        ctx.fillStyle = COLORS.arekPants;
        ctx.fillRect(x - bodyW / 2,       y + bodyH / 2, legW, legH);
        ctx.fillRect(x + bodyW / 2 - legW, y + bodyH / 2, legW, legH);

        // Body / vest (orange)
        ctx.fillStyle = COLORS.arekVest;
        ctx.fillRect(x - bodyW / 2, y - bodyH / 2, bodyW, bodyH);

        // Yellow horizontal stripe on vest
        const stripeH = bodyH * 0.18;
        ctx.fillStyle = COLORS.arekVestStripe;
        ctx.fillRect(x - bodyW / 2, y + bodyH * 0.1, bodyW, stripeH);

        // Head (skin)
        ctx.fillStyle = COLORS.arekSkin;
        ctx.beginPath();
        ctx.arc(x, y - bodyH / 2 - headR, headR, 0, Math.PI * 2);
        ctx.fill();

        // Hard hat (yellow semicircle on top of head)
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

        // Always show static hint in bottom-left
        const hintX = this._sx(120);
        const hintY = this.canvas.height - this._sy(110);

        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hintX, hintY, outerR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.arc(hintX, hintY, innerR, 0, Math.PI * 2);
        ctx.fill();

        // Draw active joystick on top when touching
        if (!input || !input.joystick || !input.joystick.active) return;

        const j = input.joystick;
        const baseX  = j.startX;
        const baseY  = j.startY;
        const thumbX = j.currentX;
        const thumbY = j.currentY;

        // Outer ring
        ctx.strokeStyle = COLORS.joystickBase;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(baseX, baseY, outerR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = COLORS.joystickBase;
        ctx.beginPath();
        ctx.arc(baseX, baseY, outerR, 0, Math.PI * 2);
        ctx.fill();

        // Inner thumb
        ctx.fillStyle = COLORS.joystickThumb;
        ctx.beginPath();
        ctx.arc(thumbX, thumbY, innerR, 0, Math.PI * 2);
        ctx.fill();
    }

    // ── action button ────────────────────────────────────────
    renderActionButton(label, enabled) {
        const ctx = this.ctx;
        const btnW = this._sx(200);
        const btnH = this._sy(90);
        const margin = this._sx(24);
        const bx = this.canvas.width - btnW - margin;
        const by = this.canvas.height - btnH - margin;
        const radius = this._sx(16);

        // Rounded rectangle
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

        // Black outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = this._sx(6);
        ctx.lineJoin = 'round';
        ctx.strokeText(text, cx, cy);

        // Red / orange fill
        ctx.fillStyle = COLORS.warning;
        ctx.fillText(text, cx, cy);

        ctx.restore();
    }
}

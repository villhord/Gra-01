import { WORLD_W, WORLD_H, QUARRY, COLORS } from '../utils/constants.js';

export class Quarry {
    constructor() {
        this.bounds = { x: 0, y: 0, w: WORLD_W, h: QUARRY.roadPlates.y };
        this.loadingZone = { ...QUARRY.loadingZone };
        this.roadPlates = { ...QUARRY.roadPlates };
        this.terrainCanvas = null;
    }

    generateTerrain(scale) {
        const w = Math.floor(WORLD_W * scale);
        const h = Math.floor(WORLD_H * scale);
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');

        // Base terrain
        ctx.fillStyle = COLORS.terrain;
        ctx.fillRect(0, 0, w, h);

        // Random stones on terrain
        const rng = mulberry32(42);
        for (let i = 0; i < 300; i++) {
            const sx = rng() * w;
            const sy = rng() * (QUARRY.roadPlates.y * scale);
            const sr = (rng() * 2 + 1) * scale;
            ctx.fillStyle = rng() > 0.5 ? COLORS.stone : COLORS.terrainDark;
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fill();
        }

        // Road plates area
        const rpY = QUARRY.roadPlates.y * scale;
        const rpH = QUARRY.roadPlates.h * scale;
        ctx.fillStyle = COLORS.roadPlate;
        ctx.fillRect(0, rpY, w, rpH);

        // Road plate grid lines
        ctx.strokeStyle = COLORS.roadPlateGrid;
        ctx.lineWidth = 1;
        const plateSize = 40 * scale;
        for (let px = 0; px < w; px += plateSize) {
            ctx.beginPath();
            ctx.moveTo(px, rpY);
            ctx.lineTo(px, rpY + rpH);
            ctx.stroke();
        }
        for (let py = rpY; py < rpY + rpH; py += plateSize) {
            ctx.beginPath();
            ctx.moveTo(0, py);
            ctx.lineTo(w, py);
            ctx.stroke();
        }

        // Loading zone markers (dashed)
        const lz = QUARRY.loadingZone;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2 * scale;
        ctx.setLineDash([8 * scale, 6 * scale]);
        ctx.strokeRect(lz.x * scale, lz.y * scale, lz.w * scale, lz.h * scale);
        ctx.setLineDash([]);

        // Quarry border
        ctx.strokeStyle = COLORS.quarryBorder;
        ctx.lineWidth = 4 * scale;
        ctx.strokeRect(0, 0, w, QUARRY.roadPlates.y * scale);

        this.terrainCanvas = c;
    }

    isInBounds(x, y, hw, hh) {
        return x - hw >= 0 && x + hw <= WORLD_W &&
               y - hh >= 0 && y + hh <= this.bounds.h;
    }

    clampToBounds(x, y, hw, hh) {
        return {
            x: Math.max(hw, Math.min(WORLD_W - hw, x)),
            y: Math.max(hh, Math.min(this.bounds.h - hh, y)),
        };
    }

    isInLoadingZone(x, y) {
        const lz = this.loadingZone;
        return x >= lz.x && x <= lz.x + lz.w && y >= lz.y && y <= lz.y + lz.h;
    }
}

function mulberry32(a) {
    return function() {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

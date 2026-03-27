import { COLORS, TEXT } from '../utils/constants.js';

export class HUD {
    render(ctx, gameState, scaleX, scaleY) {
        const w    = ctx.canvas.width;
        const barH = Math.round(40 * scaleY);

        // ── Top bar background ─────────────────────────────────
        ctx.fillStyle = COLORS.hudBg;
        ctx.fillRect(0, 0, w, barH);

        const fontSize = Math.round(18 * scaleY);
        const pad      = Math.round(14 * scaleX);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = COLORS.hud;

        const cy = barH / 2;

        // Score (left)
        ctx.textAlign = 'left';
        ctx.fillText(`${TEXT.score}: ${gameState.score}`, pad, cy);

        // Trucks counter (center)
        const tLoaded  = gameState.trucksLoaded  ?? 0;
        const tNeeded  = gameState.trucksNeeded  ?? 0;
        const truckStr = `${TEXT.trucks}: ${tLoaded}/${tNeeded}`;
        ctx.textAlign = 'center';
        ctx.fillText(truckStr, w / 2, cy);

        // Level (right)
        ctx.textAlign = 'right';
        ctx.fillText(`${TEXT.level} ${gameState.level}`, w - pad, cy);

        // ── Truck info bar ─────────────────────────────────────
        const truck = gameState.currentTruck;
        if (truck && truck.state !== 'DEPARTING') {
            const barY     = barH;
            const loadBarH = Math.round(28 * scaleY);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.fillRect(0, barY, w, loadBarH);

            const smallFont = Math.round(13 * scaleY);
            ctx.font = `bold ${smallFont}px sans-serif`;
            ctx.fillStyle = COLORS.hud;
            ctx.textBaseline = 'middle';
            const midY = barY + loadBarH / 2;

            // Truck name + load
            ctx.textAlign = 'left';
            const loadText = `${truck.type.name}: ${truck.currentLoad}t / ${truck.maxLoad}t`;
            ctx.fillText(loadText, pad, midY);

            // Per-truck stopwatch (right side)
            const elapsed = truck.loadingTimer || 0;
            const totalSec = Math.floor(elapsed);
            const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
            const ss = String(totalSec % 60).padStart(2, '0');
            ctx.textAlign = 'right';
            ctx.fillText(`${TEXT.truckTimer} ${mm}:${ss}`, w - pad, midY);

            // Load fill bar (center section)
            const barStartX = Math.round(230 * scaleX);
            const barEndX   = w - Math.round(110 * scaleX);
            const barWidth  = barEndX - barStartX;
            const innerPad  = Math.round(3 * scaleY);
            const innerH    = loadBarH - innerPad * 2;
            const innerY    = barY + innerPad;

            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(barStartX, innerY, barWidth, innerH);

            const pct = truck.getLoadPercent();
            if (pct > 0) {
                ctx.fillStyle = truck.overloaded ? COLORS.warning : (pct >= 0.9 ? COLORS.success : COLORS.fillBar);
                ctx.fillRect(barStartX + 1, innerY + 1, (barWidth - 2) * pct, innerH - 2);
            }
        }

        // ── Overload message ───────────────────────────────────
        if (gameState.overloadMessage) {
            const msgFont = Math.round(28 * scaleY);
            ctx.font = `bold ${msgFont}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = COLORS.warning;
            ctx.fillText(gameState.overloadMessage, w / 2, Math.round(90 * scaleY));
        }
    }
}

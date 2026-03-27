import { COLORS, TEXT } from '../utils/constants.js';

export class HUD {
    render(ctx, gameState, scaleX, scaleY) {
        const w = ctx.canvas.width;
        const barH = Math.round(40 * scaleY);

        // ── Top bar background ─────────────────────────────────
        ctx.fillStyle = COLORS.hudBg;
        ctx.fillRect(0, 0, w, barH);

        const fontSize = Math.round(18 * scaleY);
        const pad = Math.round(14 * scaleX);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = COLORS.hud;

        const cy = barH / 2;

        // Score (left)
        ctx.textAlign = 'left';
        ctx.fillText(`${TEXT.score}: ${gameState.score}`, pad, cy);

        // Time MM:SS (center)
        const totalSec = Math.max(0, Math.ceil(gameState.timeLeft));
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        const timeStr = `${TEXT.time}: ${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, w / 2, cy);

        // Level (right)
        ctx.textAlign = 'right';
        ctx.fillText(`${TEXT.level} ${gameState.level}`, w - pad, cy);

        // ── Truck load bar ─────────────────────────────────────
        const truck = gameState.currentTruck;
        if (truck && truck.state !== 'DEPARTING') {
            const barY = barH;
            const loadBarH = Math.round(24 * scaleY);

            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.fillRect(0, barY, w, loadBarH);

            // Truck name and load text
            const smallFont = Math.round(14 * scaleY);
            ctx.font = `bold ${smallFont}px sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = COLORS.hud;

            const loadText = `${truck.type.name}: ${truck.currentLoad}t / ${truck.maxLoad}t`;
            ctx.fillText(loadText, pad, barY + loadBarH / 2);

            // Fill bar
            const barStartX = Math.round(220 * scaleX);
            const barEndX = w - pad;
            const barWidth = barEndX - barStartX;
            const innerPad = Math.round(3 * scaleY);
            const innerH = loadBarH - innerPad * 2;
            const innerY = barY + innerPad;

            // Bar outline
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(barStartX, innerY, barWidth, innerH);

            // Fill
            const pct = truck.getLoadPercent();
            const fillColor = pct >= 0.85 ? COLORS.warning : COLORS.success;
            ctx.fillStyle = fillColor;
            ctx.fillRect(barStartX + 1, innerY + 1, (barWidth - 2) * pct, innerH - 2);
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

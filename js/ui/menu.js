import { COLORS, TEXT } from '../utils/constants.js';

export class Menu {
    // ── Main Menu ──────────────────────────────────────────────
    renderMainMenu(ctx, w, h, highScore) {
        // Background
        ctx.fillStyle = COLORS.menuBg;
        ctx.fillRect(0, 0, w, h);

        const cx = w / 2;

        // Simple loader icon (yellow rectangle with bucket)
        const iconY = h * 0.18;
        const bodyW = 80;
        const bodyH = 50;
        ctx.fillStyle = COLORS.loaderBody;
        ctx.fillRect(cx - bodyW / 2, iconY - bodyH / 2, bodyW, bodyH);
        // Cab
        ctx.fillStyle = COLORS.loaderCab;
        ctx.fillRect(cx - bodyW / 2, iconY - bodyH / 2, bodyW * 0.35, bodyH);
        // Bucket
        ctx.fillStyle = COLORS.loaderBucket;
        ctx.fillRect(cx + bodyW / 2, iconY - bodyH * 0.4, 18, bodyH * 0.8);

        // Title
        ctx.fillStyle = COLORS.hud;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.round(h * 0.06)}px sans-serif`;
        ctx.fillText(TEXT.title, cx, h * 0.36);

        // Subtitle (multiline)
        ctx.font = `${Math.round(h * 0.028)}px sans-serif`;
        const lines = TEXT.subtitle.split('\n');
        lines.forEach((line, i) => {
            ctx.fillText(line, cx, h * 0.44 + i * h * 0.04);
        });

        // Start button
        this._drawButton(ctx, cx, h * 0.58, w * 0.4, h * 0.08, TEXT.startGame);

        // High score
        if (highScore > 0) {
            ctx.fillStyle = COLORS.hud;
            ctx.font = `${Math.round(h * 0.03)}px sans-serif`;
            ctx.fillText(`${TEXT.bestScore}: ${highScore}`, cx, h * 0.72);
        }
    }

    // ── Pause ──────────────────────────────────────────────────
    renderPause(ctx, w, h) {
        ctx.fillStyle = COLORS.menuBg;
        ctx.fillRect(0, 0, w, h);

        const cx = w / 2;

        ctx.fillStyle = COLORS.hud;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.round(h * 0.07)}px sans-serif`;
        ctx.fillText(TEXT.pause, cx, h * 0.3);

        this._drawButton(ctx, cx, h * 0.48, w * 0.35, h * 0.08, TEXT.resume);
        this._drawButton(ctx, cx, h * 0.62, w * 0.35, h * 0.08, TEXT.restart);
    }

    // ── Game Over ──────────────────────────────────────────────
    renderGameOver(ctx, w, h, score, highScore, trucksLoaded) {
        ctx.fillStyle = COLORS.menuBg;
        ctx.fillRect(0, 0, w, h);

        const cx = w / 2;

        // Title
        ctx.fillStyle = COLORS.warning;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.round(h * 0.07)}px sans-serif`;
        ctx.fillText(TEXT.gameOver, cx, h * 0.22);

        // Stats
        ctx.fillStyle = COLORS.hud;
        const statFont = Math.round(h * 0.035);
        ctx.font = `${statFont}px sans-serif`;
        ctx.fillText(`${TEXT.yourScore}: ${score}`, cx, h * 0.38);
        ctx.fillText(`${TEXT.bestScore}: ${highScore}`, cx, h * 0.45);
        ctx.fillText(`${TEXT.trucksLoaded}: ${trucksLoaded}`, cx, h * 0.52);

        // Play again button
        this._drawButton(ctx, cx, h * 0.68, w * 0.4, h * 0.08, TEXT.playAgain);
    }

    // ── Level Up ─────────────────────────────────────────────
    renderLevelUp(ctx, w, h, level, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = COLORS.success;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.round(h * 0.12)}px sans-serif`;
        ctx.fillText(`${TEXT.levelUp} ${level}`, w / 2, h / 2);

        ctx.restore();
    }

    // ── Button helper ────────────────────────────────────────
    _drawButton(ctx, cx, cy, bw, bh, text) {
        const x = cx - bw / 2;
        const y = cy - bh / 2;
        const r = 10;

        ctx.fillStyle = COLORS.buttonBg;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + bw - r, y);
        ctx.quadraticCurveTo(x + bw, y, x + bw, y + r);
        ctx.lineTo(x + bw, y + bh - r);
        ctx.quadraticCurveTo(x + bw, y + bh, x + bw - r, y + bh);
        ctx.lineTo(x + r, y + bh);
        ctx.quadraticCurveTo(x, y + bh, x, y + bh - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = COLORS.buttonText;
        ctx.font = `bold ${Math.round(bh * 0.45)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, cx, cy);
    }
}

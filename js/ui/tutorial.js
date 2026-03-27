import { COLORS, TEXT } from '../utils/constants.js';

const STORAGE_KEY = 'gra01-tutorial-done';

export class Tutorial {
    constructor() {
        this.steps = [TEXT.tutorial1, TEXT.tutorial2, TEXT.tutorial3];
        this.currentStep = 0;
        this._done = false;

        // Check if tutorial was already completed
        try {
            if (localStorage.getItem(STORAGE_KEY) === '1') {
                this._done = true;
                this.currentStep = this.steps.length;
            }
        } catch (e) { /* localStorage unavailable */ }
    }

    isActive() {
        return !this._done;
    }

    isDone() {
        return this._done;
    }

    advance() {
        this.currentStep++;
        if (this.currentStep >= this.steps.length) {
            this._done = true;
            try {
                localStorage.setItem(STORAGE_KEY, '1');
            } catch (e) { /* localStorage unavailable */ }
        }
    }

    render(ctx, w, h) {
        if (this._done || this.currentStep >= this.steps.length) return;

        // Semi-transparent overlay
        ctx.fillStyle = COLORS.menuBg;
        ctx.fillRect(0, 0, w, h);

        const cx = w / 2;

        // Step text (may contain newlines)
        ctx.fillStyle = COLORS.hud;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const fontSize = Math.round(h * 0.04);
        ctx.font = `bold ${fontSize}px sans-serif`;

        const lines = this.steps[this.currentStep].split('\n');
        const lineHeight = fontSize * 1.4;
        const startY = h * 0.4 - ((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, i) => {
            ctx.fillText(line, cx, startY + i * lineHeight);
        });

        // Step indicator dots
        const dotR = 6;
        const dotSpacing = 24;
        const dotsStartX = cx - ((this.steps.length - 1) * dotSpacing) / 2;
        const dotsY = h * 0.55;
        for (let i = 0; i < this.steps.length; i++) {
            ctx.beginPath();
            ctx.arc(dotsStartX + i * dotSpacing, dotsY, dotR, 0, Math.PI * 2);
            ctx.fillStyle = i === this.currentStep ? COLORS.buttonBg : 'rgba(255,255,255,0.3)';
            ctx.fill();
        }

        // "Tap to continue" prompt
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = `${Math.round(h * 0.025)}px sans-serif`;
        ctx.fillText(TEXT.tapContinue, cx, h * 0.7);
    }
}

import {
    SANDPILE_MAX,
    SANDPILE_REGEN_RATE,
} from '../utils/constants.js';

const MIN_SCOOP_AMOUNT = 10;
const STONE_COUNT = 8;

export class SandPile {
    constructor({ x, y, radius }) {
        this.x = x;
        this.y = y;
        this.baseRadius = radius;
        this.currentRadius = radius;
        this.amount = SANDPILE_MAX;

        // Generate random small stone positions within the pile (once)
        this.stones = [];
        for (let i = 0; i < STONE_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius * 0.8;
            this.stones.push({
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist,
                size: 2 + Math.random() * 4,
            });
        }
    }

    update(dt) {
        if (this.amount < SANDPILE_MAX) {
            this.amount += SANDPILE_REGEN_RATE * dt;
            if (this.amount > SANDPILE_MAX) {
                this.amount = SANDPILE_MAX;
            }
        }
        // Update radius proportionally to amount
        this.currentRadius = this.baseRadius * (this.amount / SANDPILE_MAX);
    }

    scoop(amount) {
        if (this.amount < MIN_SCOOP_AMOUNT) {
            return 0;
        }
        const taken = Math.min(amount, this.amount);
        this.amount -= taken;
        if (this.amount < 0) this.amount = 0;
        this.currentRadius = this.baseRadius * (this.amount / SANDPILE_MAX);
        return taken;
    }

    canScoop() {
        return this.amount >= MIN_SCOOP_AMOUNT;
    }
}

import {
    AREK_SPEED,
    AREK_RADIUS,
    AREK_VISIBLE_TIME,
    AREK_WARNING_DURATION,
} from '../utils/constants.js';

export class Arek {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.speed = AREK_SPEED;
        this.active = false;
        this.visibleTimer = 0;
        this.directionTimer = 0;
        this.radius = AREK_RADIUS;
        this.warningTimer = 0;
        this._quarryBounds = null;
    }

    spawn(quarryBounds) {
        this._quarryBounds = quarryBounds;
        this.x = quarryBounds.x + Math.random() * quarryBounds.w;
        this.y = quarryBounds.y + Math.random() * quarryBounds.h;
        this.angle = Math.random() * Math.PI * 2;
        this.active = true;
        this.visibleTimer = AREK_VISIBLE_TIME;
        this.warningTimer = AREK_WARNING_DURATION;
        this.directionTimer = 2 + Math.random() * 2;
    }

    update(dt) {
        if (!this.active) return;

        // Decrease timers
        this.visibleTimer -= dt * 1000;
        if (this.warningTimer > 0) {
            this.warningTimer -= dt * 1000;
            if (this.warningTimer < 0) this.warningTimer = 0;
        }

        // Deactivate when time runs out
        if (this.visibleTimer <= 0) {
            this.deactivate();
            return;
        }

        // Change direction randomly every 2-4 seconds
        this.directionTimer -= dt;
        if (this.directionTimer <= 0) {
            this.angle = Math.random() * Math.PI * 2;
            this.directionTimer = 2 + Math.random() * 2;
        }

        // Move in current direction
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;

        // Stay within quarry bounds
        if (this._quarryBounds) {
            const b = this._quarryBounds;
            if (this.x - this.radius < b.x) {
                this.x = b.x + this.radius;
                this.angle = Math.PI - this.angle;
            }
            if (this.x + this.radius > b.x + b.w) {
                this.x = b.x + b.w - this.radius;
                this.angle = Math.PI - this.angle;
            }
            if (this.y - this.radius < b.y) {
                this.y = b.y + this.radius;
                this.angle = -this.angle;
            }
            if (this.y + this.radius > b.y + b.h) {
                this.y = b.y + b.h - this.radius;
                this.angle = -this.angle;
            }
        }
    }

    isShowingWarning() {
        return this.warningTimer > 0;
    }

    getBounds() {
        return {
            cx: this.x,
            cy: this.y,
            r: this.radius,
        };
    }

    deactivate() {
        this.active = false;
    }
}

import {
    LOADER_W,
    LOADER_H,
    LOADER_MAX_SPEED,
    LOADER_ACCELERATION,
    LOADER_FRICTION,
    LOADER_TURN_RATE,
    LOADER_BUCKET_CAPACITY,
    LOADER_SCOOP_TIME,
    LOADER_DUMP_TIME,
    AREK_STUN_TIME,
} from '../utils/constants.js';

const BUCKET_EMPTY = 'EMPTY';
const BUCKET_SCOOPING = 'SCOOPING';
const BUCKET_FULL = 'FULL';
const BUCKET_DUMPING = 'DUMPING';

export class Loader {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.speed = 0;
        this.width = LOADER_W;
        this.height = LOADER_H;
        this.bucketState = BUCKET_EMPTY;
        this.bucketLoad = 0;
        this.stunTimer = 0;
        this._actionTimer = 0;
    }

    update(dt, joystick) {
        // Decrease stun timer
        if (this.stunTimer > 0) {
            this.stunTimer -= dt * 1000;
            if (this.stunTimer < 0) this.stunTimer = 0;
            return;
        }

        // Handle action timers (scooping / dumping)
        if (this._actionTimer > 0) {
            this._actionTimer -= dt * 1000;
            if (this._actionTimer <= 0) {
                this._actionTimer = 0;
                if (this.bucketState === BUCKET_SCOOPING) {
                    this.bucketState = BUCKET_FULL;
                } else if (this.bucketState === BUCKET_DUMPING) {
                    this.bucketState = BUCKET_EMPTY;
                    this.bucketLoad = 0;
                }
            }
            return;
        }

        // Movement from joystick
        if (joystick && joystick.magnitude > 0) {
            // Turn toward joystick angle
            let targetAngle = joystick.angle;
            let diff = targetAngle - this.angle;
            // Normalize to -PI..PI
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;

            const maxTurn = LOADER_TURN_RATE * dt;
            if (Math.abs(diff) < maxTurn) {
                this.angle = targetAngle;
            } else {
                this.angle += Math.sign(diff) * maxTurn;
            }

            // Accelerate toward target speed
            const targetSpeed = joystick.magnitude * LOADER_MAX_SPEED;
            if (this.speed < targetSpeed) {
                this.speed += LOADER_ACCELERATION * dt;
                if (this.speed > targetSpeed) this.speed = targetSpeed;
            } else {
                this.speed = targetSpeed;
            }
        } else {
            // Apply friction when no input
            this.speed *= LOADER_FRICTION;
            if (this.speed < 1) this.speed = 0;
        }

        // Apply movement
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;
    }

    startScoop() {
        this.bucketState = BUCKET_SCOOPING;
        this._actionTimer = LOADER_SCOOP_TIME;
    }

    startDump() {
        this.bucketState = BUCKET_DUMPING;
        this._actionTimer = LOADER_DUMP_TIME;
    }

    stun() {
        this.stunTimer = AREK_STUN_TIME;
        this.speed = 0;
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            w: this.width,
            h: this.height,
        };
    }
}

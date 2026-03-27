import {
    LOADER_W, LOADER_H,
    LOADER_MAX_SPEED, LOADER_ACCELERATION, LOADER_FRICTION, LOADER_TURN_RATE,
    LOADER_SCOOP_TIME, LOADER_DUMP_TIME,
    AREK_STUN_TIME,
} from '../utils/constants.js';

const BUCKET_EMPTY    = 'EMPTY';
const BUCKET_SCOOPING = 'SCOOPING';
const BUCKET_FULL     = 'FULL';
const BUCKET_DUMPING  = 'DUMPING';

export class Loader {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.speed = 0;
        this.width  = LOADER_W;
        this.height = LOADER_H;
        this.bucketState = BUCKET_EMPTY;
        this.bucketLoad  = 0;  // tons currently in bucket
        this.fillTons    = 0;  // hold-to-scoop progress (tons, 0..BUCKET_MAX_TONS)
        this.stunTimer   = 0;
        this._actionTimer = 0;
    }

    update(dt, joystick) {
        if (this.stunTimer > 0) {
            this.stunTimer -= dt * 1000;
            if (this.stunTimer < 0) this.stunTimer = 0;
            return;
        }

        if (this._actionTimer > 0) {
            this._actionTimer -= dt * 1000;
            if (this._actionTimer <= 0) {
                this._actionTimer = 0;
                if (this.bucketState === BUCKET_SCOOPING) this.bucketState = BUCKET_FULL;
                else if (this.bucketState === BUCKET_DUMPING) {
                    this.bucketState = BUCKET_EMPTY;
                    this.bucketLoad  = 0;
                }
            }
            return;
        }

        if (joystick && joystick.magnitude > 0) {
            let diff = joystick.angle - this.angle;
            while (diff >  Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            const maxTurn = LOADER_TURN_RATE * dt;
            this.angle += Math.abs(diff) < maxTurn ? diff : Math.sign(diff) * maxTurn;

            const targetSpeed = joystick.magnitude * LOADER_MAX_SPEED;
            this.speed += LOADER_ACCELERATION * dt;
            if (this.speed > targetSpeed) this.speed = targetSpeed;
        } else {
            this.speed *= LOADER_FRICTION;
            if (this.speed < 1) this.speed = 0;
        }

        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;
    }

    startScoop(tons) {
        this.bucketState = BUCKET_SCOOPING;
        this.bucketLoad  = tons;
        this.fillTons    = 0;
        this._actionTimer = LOADER_SCOOP_TIME;
    }

    startDump() {
        this.bucketState  = BUCKET_DUMPING;
        this._actionTimer = LOADER_DUMP_TIME;
    }

    stun() {
        this.stunTimer = AREK_STUN_TIME;
        this.speed = 0;
    }

    getBounds() {
        return { x: this.x - this.width/2, y: this.y - this.height/2, w: this.width, h: this.height };
    }
}

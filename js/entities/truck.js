import { TRUCK_TYPES } from '../utils/constants.js';

const STATE_ARRIVING = 'ARRIVING';
const STATE_WAITING = 'WAITING';
const STATE_FULL = 'FULL';
const STATE_DEPARTING = 'DEPARTING';

const FULL_PAUSE_TIME = 1000; // ms pause before departing when full

export class Truck {
    constructor(typeKey, truckWait, truckEntry, truckExit) {
        const typeInfo = TRUCK_TYPES[typeKey];

        this.typeKey = typeKey;
        this.type = typeInfo;
        this.maxLoad = typeInfo.maxLoad;
        this.width = typeInfo.width;
        this.height = typeInfo.height;

        this.x = truckEntry.x;
        this.y = truckEntry.y;
        this.state = STATE_ARRIVING;
        this.currentLoad = 0;

        this._waitPos = { x: truckWait.x, y: truckWait.y };
        this._exitPos = { x: truckExit.x, y: truckExit.y };
        this._fullPauseTimer = 0;
    }

    update(dt) {
        const speed = this.type.speed;

        switch (this.state) {
            case STATE_ARRIVING: {
                // Move from entry toward wait position
                const dx = this._waitPos.x - this.x;
                const dy = this._waitPos.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < speed * dt) {
                    this.x = this._waitPos.x;
                    this.y = this._waitPos.y;
                    this.state = STATE_WAITING;
                } else {
                    const nx = dx / dist;
                    const ny = dy / dist;
                    this.x += nx * speed * dt;
                    this.y += ny * speed * dt;
                }
                break;
            }

            case STATE_WAITING:
                // Idle, waiting for load
                break;

            case STATE_FULL: {
                // Brief pause then depart
                this._fullPauseTimer -= dt * 1000;
                if (this._fullPauseTimer <= 0) {
                    this.state = STATE_DEPARTING;
                }
                break;
            }

            case STATE_DEPARTING: {
                // Move toward exit
                const dx = this._exitPos.x - this.x;
                const dy = this._exitPos.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < speed * dt) {
                    this.x = this._exitPos.x;
                    this.y = this._exitPos.y;
                } else {
                    const nx = dx / dist;
                    const ny = dy / dist;
                    this.x += nx * speed * dt;
                    this.y += ny * speed * dt;
                }
                break;
            }
        }
    }

    addLoad(tons) {
        if (this.currentLoad + tons > this.maxLoad) {
            return 0; // overload attempt
        }
        this.currentLoad += tons;
        if (this.currentLoad >= this.maxLoad) {
            this.state = STATE_FULL;
            this._fullPauseTimer = FULL_PAUSE_TIME;
        }
        return tons;
    }

    isFull() {
        return this.currentLoad >= this.maxLoad;
    }

    isGone() {
        return this.state === STATE_DEPARTING &&
            this.x <= this._exitPos.x + 5;
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            w: this.width,
            h: this.height,
        };
    }

    getLoadPercent() {
        return this.currentLoad / this.maxLoad;
    }
}

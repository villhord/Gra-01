export class Input {
    constructor(canvas) {
        this.canvas = canvas;
        this.joystick = { active: false, angle: 0, magnitude: 0, startX: 0, startY: 0, currentX: 0, currentY: 0 };
        this.actionPressed = false;
        this.actionJustPressed = false;
        this.pausePressed = false;
        this.tapAnywhere = false;

        // Keyboard state
        this.keys = {};

        // Joystick config
        this.joystickMaxRadius = 50;
        this.joystickZone = 0.4; // left 40% of screen

        // Touch tracking
        this.joystickTouchId = null;
        this.actionTouchId = null;

        this._bindTouch();
        this._bindKeyboard();
    }

    _bindTouch() {
        const c = this.canvas;

        c.addEventListener('touchstart', (e) => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                const pos = this._touchPos(touch);
                const relX = pos.x / this.canvas.width;
                const relY = pos.y / this.canvas.height;

                // Pause button (top-right corner)
                if (relX > 0.9 && relY < 0.12) {
                    this.pausePressed = true;
                    continue;
                }

                // Left side = joystick
                if (relX < this.joystickZone && this.joystickTouchId === null) {
                    this.joystickTouchId = touch.identifier;
                    this.joystick.active = true;
                    this.joystick.startX = pos.x;
                    this.joystick.startY = pos.y;
                    this.joystick.currentX = pos.x;
                    this.joystick.currentY = pos.y;
                    this.joystick.magnitude = 0;
                }
                // Right side = action
                else if (relX >= this.joystickZone) {
                    this.actionTouchId = touch.identifier;
                    this.actionPressed = true;
                    this.actionJustPressed = true;
                }

                this.tapAnywhere = true;
            }
        }, { passive: false });

        c.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.joystickTouchId) {
                    const pos = this._touchPos(touch);
                    this.joystick.currentX = pos.x;
                    this.joystick.currentY = pos.y;

                    const dx = pos.x - this.joystick.startX;
                    const dy = pos.y - this.joystick.startY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const maxR = this.joystickMaxRadius * (this.canvas.width / 1600);

                    this.joystick.magnitude = Math.min(dist / maxR, 1);
                    this.joystick.angle = Math.atan2(dy, dx);

                    if (dist > maxR) {
                        this.joystick.currentX = this.joystick.startX + Math.cos(this.joystick.angle) * maxR;
                        this.joystick.currentY = this.joystick.startY + Math.sin(this.joystick.angle) * maxR;
                    }
                }
            }
        }, { passive: false });

        const endTouch = (e) => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.joystickTouchId) {
                    this.joystickTouchId = null;
                    this.joystick.active = false;
                    this.joystick.magnitude = 0;
                }
                if (touch.identifier === this.actionTouchId) {
                    this.actionTouchId = null;
                    this.actionPressed = false;
                }
            }
        };

        c.addEventListener('touchend', endTouch, { passive: false });
        c.addEventListener('touchcancel', endTouch, { passive: false });
    }

    _bindKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                this.actionJustPressed = true;
                this.actionPressed = true;
            }
            if (e.code === 'Escape' || e.code === 'KeyP') {
                this.pausePressed = true;
            }
            this.tapAnywhere = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'Space') {
                this.actionPressed = false;
            }
        });
    }

    _touchPos(touch) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (touch.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (touch.clientY - rect.top) * (this.canvas.height / rect.height),
        };
    }

    getJoystick() {
        // Keyboard fallback
        let kx = 0, ky = 0;
        if (this.keys['ArrowUp'] || this.keys['KeyW']) ky = -1;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) ky = 1;
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) kx = -1;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) kx = 1;

        if (kx !== 0 || ky !== 0) {
            const mag = Math.min(Math.sqrt(kx * kx + ky * ky), 1);
            return { angle: Math.atan2(ky, kx), magnitude: mag };
        }

        return { angle: this.joystick.angle, magnitude: this.joystick.magnitude };
    }

    consumeAction() {
        const was = this.actionJustPressed;
        this.actionJustPressed = false;
        return was;
    }

    consumePause() {
        const was = this.pausePressed;
        this.pausePressed = false;
        return was;
    }

    consumeTap() {
        const was = this.tapAnywhere;
        this.tapAnywhere = false;
        return was;
    }
}

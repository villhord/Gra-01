import { WORLD_W, WORLD_H, TICK_RATE } from './utils/constants.js';
import { Input } from './input.js';
import { Renderer } from './renderer.js';
import { Game } from './game.js';
import { initAudio } from './utils/audio.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let game, input, renderer;
let lastTime = 0;
let accumulator = 0;
const dt = TICK_RATE / 1000; // fixed timestep in seconds

function resize() {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    // Letterbox/pillarbox: fit game world into screen keeping aspect ratio
    const scale = Math.min(screenW / WORLD_W, screenH / WORLD_H);
    const displayW = Math.floor(WORLD_W * scale);
    const displayH = Math.floor(WORLD_H * scale);

    // Canvas drawing size uses devicePixelRatio for sharp rendering on HiDPI
    canvas.width = Math.floor(displayW * dpr);
    canvas.height = Math.floor(displayH * dpr);

    // CSS size = displayed size (centered on screen)
    canvas.style.width = displayW + 'px';
    canvas.style.height = displayH + 'px';
    canvas.style.left = Math.floor((screenW - displayW) / 2) + 'px';
    canvas.style.top = Math.floor((screenH - displayH) / 2) + 'px';

    if (game && game.quarry) {
        game.quarry.generateTerrain(canvas.width / WORLD_W);
    }
}

function init() {
    resize();
    input = new Input(canvas);
    renderer = new Renderer(canvas);
    game = new Game(canvas, input, renderer);
    game.quarry.generateTerrain(canvas.width / WORLD_W);

    // Init audio on first user interaction
    const startAudio = () => {
        initAudio();
        window.removeEventListener('touchstart', startAudio);
        window.removeEventListener('click', startAudio);
        window.removeEventListener('keydown', startAudio);
    };
    window.addEventListener('touchstart', startAudio, { once: true });
    window.addEventListener('click', startAudio, { once: true });
    window.addEventListener('keydown', startAudio, { once: true });

    requestAnimationFrame(loop);
}

function loop(timestamp) {
    if (lastTime === 0) lastTime = timestamp;
    const frameTime = Math.min((timestamp - lastTime) / 1000, 0.1); // cap at 100ms
    lastTime = timestamp;

    accumulator += frameTime;

    while (accumulator >= dt) {
        game.update(dt);
        accumulator -= dt;
    }

    game.render();
    requestAnimationFrame(loop);
}

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 100));

// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
}

init();

// === WORLD ===
export const WORLD_W = 1600;
export const WORLD_H = 900;

// === COLORS ===
export const COLORS = {
    terrain: '#C8B07A',
    terrainDark: '#B89E6A',
    sand: '#D2B48C',
    sandDark: '#C2A278',
    stone: '#8B8378',
    roadPlate: '#888888',
    roadPlateGrid: '#777777',
    quarryBorder: '#5C4033',
    loaderBody: '#E8C830',
    loaderCab: '#D4A820',
    loaderBucket: '#5A4A2A',
    loaderWheel: '#1A1A1A',
    loaderArm: '#C0A020',
    loaderArticulation: '#666666',
    truck3Body: '#6B7B8D',
    truck4Body: '#5A6A7C',
    patelniaBody: '#4A5A6C',
    truckCab: '#3A4A5C',
    truckCargo: '#D2B48C',
    truckWindshield: '#87CEEB',
    arekVest: '#FF8C00',
    arekVestStripe: '#FFFF00',
    arekHelmet: '#FFD700',
    arekSkin: '#DEB887',
    arekPants: '#2F4F4F',
    hud: '#FFFFFF',
    hudBg: 'rgba(0, 0, 0, 0.55)',
    menuBg: 'rgba(0, 0, 0, 0.78)',
    buttonBg: '#D4A017',
    buttonText: '#FFFFFF',
    warning: '#FF4444',
    success: '#44FF44',
    joystickBase: 'rgba(255, 255, 255, 0.2)',
    joystickThumb: 'rgba(255, 255, 255, 0.5)',
    actionButton: 'rgba(212, 160, 23, 0.75)',
    actionButtonHold: 'rgba(255, 200, 0, 0.9)',
    actionButtonDisabled: 'rgba(128, 128, 128, 0.3)',
    fillBar: '#D2B48C',
    speechBg: 'rgba(255,255,255,0.93)',
    speechText: '#222222',
};

// === LOADER ===
export const LOADER_W = 60;
export const LOADER_H = 40;
export const LOADER_MAX_SPEED = 150;
export const LOADER_ACCELERATION = 120;
export const LOADER_FRICTION = 0.92;
export const LOADER_TURN_RATE = 2.5;
export const BUCKET_FILL_RATE = 1.0;  // tons/second while holding
export const BUCKET_MAX_TONS  = 4;    // max bucket capacity
export const LOADER_SCOOP_TIME = 600; // ms animation
export const LOADER_DUMP_TIME  = 600;

// === TRUCKS ===
export const TRUCK_TYPES = {
    '3-osio': {
        name: '3-osiówka',
        maxLoad: 14,
        width: 80,
        height: 35,
        axles: 3,
        color: '#6B7B8D',
        speed: 60,
    },
    '4-osio': {
        name: '4-osiówka',
        maxLoad: 18,
        width: 90,
        height: 38,
        axles: 4,
        color: '#5A6A7C',
        speed: 50,
    },
    patelnia: {
        name: 'Patelnia',
        maxLoad: 25,
        width: 120,
        height: 38,
        axles: 6,
        color: '#4A5A6C',
        speed: 40,
    },
};

// === SAND PILES ===
export const SANDPILE_MAX = 100;
export const SANDPILE_REGEN_RATE = 2;
export const SANDPILE_INTERACTION_DIST = 100;

// === AREK ===
export const AREK_SPEED = 40;
export const AREK_RADIUS = 15;
export const AREK_PENALTY_SCORE = 200;
export const AREK_STUN_TIME = 1500;
export const AREK_VISIBLE_TIME = 18000;
export const AREK_WARNING_DURATION = 2000;

// === LEVELS (trucks = required per level, increases by 1 each level) ===
export const LEVELS = [
    { trucks: 2, types: ['3-osio'],                        arekInterval: 0 },
    { trucks: 3, types: ['3-osio', '4-osio'],              arekInterval: 30000 },
    { trucks: 4, types: ['3-osio', '4-osio'],              arekInterval: 25000 },
    { trucks: 5, types: ['4-osio', 'patelnia'],            arekInterval: 20000 },
    { trucks: 6, types: ['4-osio', 'patelnia'],            arekInterval: 15000 },
    { trucks: 7, types: ['3-osio', '4-osio', 'patelnia'], arekInterval: 12000 },
];

// === SCORING ===
export const SCORE_PER_TON        = 50;   // per ton loaded (up to maxLoad)
export const SCORE_ACCURACY_BONUS = 300;  // exact load bonus (±1t)
export const SCORE_TIME_BONUS_MAX = 500;  // max time bonus per truck
export const SCORE_TIME_WINDOW    = 90;   // seconds for full time bonus
export const SCORE_OVERLOAD_PENALTY = 400; // deducted for overload

// === PHYSICS ===
export const INTERACTION_DIST = 100;
export const TICK_RATE = 1000 / 60;

// === TEXTS (PL) ===
export const TEXT = {
    title: 'GRA-01: ŁADOWARKA',
    subtitle: 'Załaduj piasek na ciężarówki!',
    startGame: 'ROZPOCZNIJ GRĘ',
    score: 'Wynik',
    level: 'Poziom',
    trucks: 'Auta',
    pause: 'PAUZA',
    resume: 'KONTYNUUJ',
    restart: 'OD NOWA',
    gameOver: 'KONIEC!',
    trucksLoaded: 'Załadowanych aut',
    yourScore: 'Twój wynik',
    bestScore: 'Najlepszy wynik',
    playAgain: 'ZAGRAJ PONOWNIE',
    scoop: 'NABIERZ',
    dump: 'WYSYP',
    horn: 'SYGNAŁ',
    overloaded: 'PRZEŁADOWANE!',
    arekWarning: 'UWAGA AREK!',
    levelUp: 'POZIOM',
    tapContinue: 'Dotknij, aby kontynuować',
    speech: 'Czekam na załadunek!',
    truckTimer: 'Czas:',
    accuracy: 'Dokładnie!',
    complete: 'UKOŃCZONO!',
};

// === QUARRY LAYOUT ===
export const QUARRY = {
    borderWidth: 8,
    loadingZone: { x: 200, y: 720, w: 1200, h: 80 },
    roadPlates:  { x: 0, y: 750, w: 1600, h: 150 },
    truckEntry:  { x: 1650, y: 780 },
    truckExit:   { x: -160, y: 780 },
    truckWait:   { x: 800,  y: 780 },
    sandPiles: [
        { x: 250,  y: 200, radius: 80 },
        { x: 1200, y: 180, radius: 70 },
        { x: 350,  y: 500, radius: 75 },
    ],
    loaderStart: { x: 800, y: 450 },
};

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
    loaderBody: '#E8B828',
    loaderCab: '#D4A017',
    loaderBucket: '#C89A10',
    loaderWheel: '#333333',
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
    hudBg: 'rgba(0, 0, 0, 0.5)',
    menuBg: 'rgba(0, 0, 0, 0.75)',
    buttonBg: '#D4A017',
    buttonText: '#FFFFFF',
    warning: '#FF4444',
    success: '#44FF44',
    joystickBase: 'rgba(255, 255, 255, 0.2)',
    joystickThumb: 'rgba(255, 255, 255, 0.5)',
    actionButton: 'rgba(212, 160, 23, 0.6)',
    actionButtonDisabled: 'rgba(128, 128, 128, 0.3)',
};

// === LOADER ===
export const LOADER_W = 60;
export const LOADER_H = 40;
export const LOADER_MAX_SPEED = 150; // px/s
export const LOADER_ACCELERATION = 120; // px/s^2
export const LOADER_FRICTION = 0.92;
export const LOADER_TURN_RATE = 2.5; // rad/s
export const LOADER_BUCKET_CAPACITY = 3; // tons per scoop
export const LOADER_SCOOP_TIME = 800; // ms
export const LOADER_DUMP_TIME = 800; // ms

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

export const TRUCK_ARRIVAL_DELAY = 2000; // ms between trucks

// === SAND PILES ===
export const SANDPILE_MAX = 100; // units of sand
export const SANDPILE_REGEN_RATE = 2; // units/s
export const SANDPILE_INTERACTION_DIST = 70;

// === AREK ===
export const AREK_SPEED = 40; // px/s
export const AREK_RADIUS = 15;
export const AREK_PENALTY_TIME = 5; // seconds deducted
export const AREK_STUN_TIME = 1500; // ms loader stunned
export const AREK_VISIBLE_TIME = 18000; // ms on screen
export const AREK_WARNING_DURATION = 2000; // ms warning displayed

// === LEVELS ===
export const LEVELS = [
    { time: 90, trucks: 2, types: ['3-osio'], arekInterval: 0 },
    { time: 85, trucks: 2, types: ['3-osio', '4-osio'], arekInterval: 30000 },
    { time: 80, trucks: 3, types: ['3-osio', '4-osio'], arekInterval: 25000 },
    { time: 75, trucks: 3, types: ['4-osio', 'patelnia'], arekInterval: 20000 },
    { time: 70, trucks: 4, types: ['4-osio', 'patelnia'], arekInterval: 15000 },
    { time: 65, trucks: 4, types: ['3-osio', '4-osio', 'patelnia'], arekInterval: 12000 },
];

// === SCORING ===
export const SCORE_PER_DUMP = 100;
export const SCORE_TRUCK_BONUS = 500;
export const SCORE_TIME_MULTIPLIER = 5;
export const SCORE_OVERLOAD_PENALTY = -200;

// === PHYSICS ===
export const INTERACTION_DIST = 70;
export const TICK_RATE = 1000 / 60;

// === TEXTS (PL) ===
export const TEXT = {
    title: 'GRA-01: ŁADOWARKA',
    subtitle: 'Załaduj piasek na ciężarówki\nzanim skończy się czas!',
    startGame: 'ROZPOCZNIJ GRĘ',
    score: 'Wynik',
    time: 'Czas',
    level: 'Poziom',
    pause: 'PAUZA',
    resume: 'KONTYNUUJ',
    restart: 'OD NOWA',
    gameOver: 'KONIEC CZASU!',
    trucksLoaded: 'Załadowane ciężarówki',
    yourScore: 'Twój wynik',
    bestScore: 'Najlepszy wynik',
    playAgain: 'ZAGRAJ PONOWNIE',
    scoop: 'ZAŁADUJ',
    dump: 'WYSYP',
    overloaded: 'PRZEŁADOWANE!',
    arekWarning: 'UWAGA AREK!',
    levelUp: 'POZIOM',
    tutorial1: 'Przesuń palcem po lewej stronie\nekranu, aby sterować ładowarką',
    tutorial2: 'Podjedź do hałdy piasku\ni naciśnij ZAŁADUJ',
    tutorial3: 'Podjedź do ciężarówki\ni naciśnij WYSYP',
    tapContinue: 'Dotknij, aby kontynuować',
    rotatDevice: 'Obróć urządzenie do pozycji poziomej',
};

// === QUARRY LAYOUT ===
export const QUARRY = {
    borderWidth: 8,
    loadingZone: { x: 200, y: 720, w: 1200, h: 80 },
    roadPlates: { x: 0, y: 750, w: 1600, h: 150 },
    truckEntry: { x: 1600, y: 780 },
    truckExit: { x: -150, y: 780 },
    truckWait: { x: 800, y: 780 },
    sandPiles: [
        { x: 250, y: 200, radius: 80 },
        { x: 1200, y: 180, radius: 70 },
        { x: 350, y: 500, radius: 75 },
    ],
    loaderStart: { x: 800, y: 450 },
};

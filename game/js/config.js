// Copperhead County — shared constants, palette, vehicle and mission data.
// Everything here is original: our own desert county, characters and places.
export const WORLD = { w: 3200, h: 2400 };
export const VIEW = { w: 1280, h: 720 };

// Road grid (avenues run north-south, streets east-west).
export const ROADS_X = [400, 800, 1200, 1600, 2000, 2400, 2800];
export const ROADS_Y = [400, 800, 1200, 1600, 2000];
export const ROAD_W = 96;
export const HIGHWAY_Y = 210; // east-west highway band near the north edge
export const HIGHWAY_W = 150;

export const PALETTE = {
  sand: '#d9a55f', sandDark: '#c78f4a', sandLight: '#e8bd7d',
  dirt: '#b97f3e', asphalt: '#3d3a38', asphaltLine: '#e8d27a',
  highway: '#35322f', sidewalk: '#cbb28a',
  roofA: '#a4552f', roofB: '#7d4a35', roofC: '#8f6b3d', roofD: '#6e5a44',
  neonPink: '#ff5fa2', neonGold: '#ffc93c', neonTeal: '#37e0c8',
  copper: '#e07b39', gold: '#f2b234',
  sheriff: '#f2efe6', sheriffTrim: '#1c2f57',
  playerJacket: '#2f7d5b', playerSkin: '#e8b98a',
  uiPanel: 'rgba(20,12,6,0.82)', uiText: '#ffe9c4', uiAccent: '#ffc93c',
};

// Five stealable vehicle types. Top speed in px/s, accel, handling, size.
export const VEHICLE_TYPES = {
  sedan:  { label: 'Sedan',    top: 330, accel: 240, turn: 2.6, len: 52, wid: 26, color: '#b8433a', price: 0 },
  pickup: { label: 'Pickup',   top: 300, accel: 210, turn: 2.3, len: 56, wid: 28, color: '#3a6ea5', price: 0 },
  motor:  { label: 'Motorbike',top: 380, accel: 320, turn: 3.4, len: 40, wid: 16, color: '#c9a227', price: 0 },
  bus:    { label: 'Bus',      top: 230, accel: 130, turn: 1.6, len: 84, wid: 30, color: '#7a4a9e', price: 0 },
  van:    { label: 'Van',      top: 270, accel: 180, turn: 2.0, len: 62, wid: 30, color: '#5a7d4a', price: 0 },
};
export const SHERIFF_CAR = { top: 350, accel: 280, turn: 2.9, len: 54, wid: 27 };

// Named places on the casino strip (Spur Avenue, x = 1600).
export const CASINOS = [
  { name: 'The Copper Spur',  x: 1600, y: 640,  w: 190, h: 120, color: '#8f2f3d', neon: '#ff5fa2' },
  { name: 'Desert Rose Casino', x: 1600, y: 1000, w: 200, h: 130, color: '#7a2f5e', neon: '#ffc93c' },
  { name: 'Lucky Coyote',     x: 1600, y: 1360, w: 180, h: 110, color: '#2f5e4a', neon: '#37e0c8' },
  { name: 'Gold Pan Saloon',  x: 1600, y: 1720, w: 170, h: 110, color: '#6e4a1f', neon: '#f2b234' },
];

export const PLACES = {
  garage:   { name: "Duke's Garage",   x: 820,  y: 820,  label: 'GARAGE' },
  diner:    { name: 'Mirage Diner',    x: 2350, y: 210,  label: 'DINER' },
  hideout:  { name: 'Rook Hideout',    x: 420,  y: 2180, label: 'HIDEOUT' },
  clinic:   { name: 'Copper Clinic',   x: 2420, y: 1180, label: 'CLINIC' },
  sheriffHQ:{ name: 'Sheriff Office',  x: 1220, y: 420,  label: 'SHERIFF' },
  stash:    { name: 'Copper Stash',    x: 2680, y: 1780, label: 'STASH' },
  truckYard:{ name: 'Vera Truck Yard', x: 460,  y: 1420, label: 'YARD' },
};

export const DEBT_TOTAL = 4000;
export const NUGGET_COUNT = 20;
export const NUGGET_VALUE = 25;
export const PED_COUNT = 26;

// Six story missions. Stages: goto (reach marker), talk (press E),
// deliver (drive to marker while in a car), survive (stay alive X sec),
// collect (pick up N nuggets), escape (reach marker while wanted >= 3).
export const MISSIONS = [
  {
    name: 'First Gear', giver: 'Duke',
    intro: [
      'DUKE: Rook! Vera Voss owns your hide now. Four grand, or she takes the wheels.',
      'DUKE: Prove you can still drive. Jack that red sedan by the garage and bring it back here.',
      'ROOK: One sedan. Then we talk about the four thousand.',
    ],
    stages: [
      { type: 'steal', text: 'Steal the red sedan parked by the garage', x: 880, y: 900, r: 90 },
      { type: 'goto',  text: 'Bring the sedan back to Duke\'s Garage', x: 820, y: 820, r: 110, needCar: true },
    ],
    reward: 300,
  },
  {
    name: 'Desert Run', giver: 'Duke',
    intro: [
      'DUKE: A package for the Mirage Diner, up on the highway. Fast and quiet.',
      'DUKE: Sixty seconds, Rook. The desert does not wait, and neither does the buyer.',
      'ROOK: Sixty seconds. Watch me.',
    ],
    stages: [
      { type: 'goto', text: 'Drive the package to the Mirage Diner (60s)', x: 2350, y: 210, r: 120, needCar: true, timer: 60 },
    ],
    reward: 450,
  },
  {
    name: 'Copper Stash', giver: 'Vera Voss',
    intro: [
      'VERA: You owe me, Calloway. My boys hid copper nuggets all over the county.',
      'VERA: Bring me five. Consider it a down payment on your freedom.',
      'ROOK: Five nuggets. Then I am five steps closer to done with you.',
    ],
    stages: [
      { type: 'collect', text: 'Collect 5 copper nuggets for Vera', count: 5 },
    ],
    reward: 600,
  },
  {
    name: 'Heat Wave', giver: 'Sheriff Boone',
    intro: [
      'BOONE: Calloway! The whole county is looking for you. Three stars and climbing.',
      'BOONE: Run, boy. Survive sixty seconds, reach your hideout, and I will call off the dogs.',
      'ROOK: Sixty seconds of heat. I have done worse in worse cars.',
    ],
    stages: [
      { type: 'escape', text: 'Survive the heat for 60s, then reach the hideout', x: 420, y: 2180, r: 130, timer: 60, wanted: 3 },
    ],
    reward: 800,
  },
  {
    name: 'Casino Lights', giver: 'Vera Voss',
    intro: [
      'VERA: The Desert Rose owes me chips. The Lucky Coyote owes me more.',
      'VERA: Carry my chips down the strip. Smile at the cameras. Do not stop.',
      'ROOK: Two casinos, one bag of chips. What could go wrong?',
    ],
    stages: [
      { type: 'goto', text: 'Deliver chips to the Desert Rose Casino', x: 1600, y: 1000, r: 140 },
      { type: 'goto', text: 'Deliver the rest to the Lucky Coyote', x: 1600, y: 1360, r: 140 },
    ],
    reward: 1100,
  },
  {
    name: 'The Long Haul', giver: 'Vera Voss',
    intro: [
      'VERA: Last job, Calloway. My van, full of copper, to the Gold Pan Saloon.',
      'VERA: Bring it in one piece and the four thousand is forgiven. All of it.',
      'ROOK: One long haul. Then Copperhead County is mine again.',
    ],
    stages: [
      { type: 'steal', text: 'Take Vera\'s van from the truck yard', x: 460, y: 1420, r: 110 },
      { type: 'goto',  text: 'Haul the van to the Gold Pan Saloon', x: 1600, y: 1720, r: 150, needCar: true, carType: 'van' },
    ],
    reward: 4000,
  },
];

export const RADIO_STATIONS = [
  { name: 'KCOY 88.1 — Desert Country', tempo: 96,  scale: [0, 2, 4, 7, 9],    root: 220, wave: 'triangle' },
  { name: 'DUST ROCK 104.7',            tempo: 132, scale: [0, 3, 5, 6, 10],   root: 164, wave: 'sawtooth' },
  { name: 'NEON MIRAGE 99.9',           tempo: 112, scale: [0, 3, 5, 7, 10],   root: 196, wave: 'square' },
];

export const CONTROLS_TEXT = [
  'WASD / Arrows — walk & drive',
  'E — enter / steal car, talk, interact',
  'Mouse — aim pistol    Click — shoot',
  'F — punch    R — radio station    M — mute',
  'P / Esc — pause    Shift — sprint',
  'SPACE — brake (car) / dodge (on foot)',
];

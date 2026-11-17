// Deterministic screenshot staging (?shot=start|play|chase|mission).
// Each shot sets up one readable scene: title, driving, a sheriff chase
// with a roadblock, or a mission in progress at the casino strip.
import { VEHICLE_TYPES } from './config.js';
import { makeCar, makeSheriffCar } from './vehicles.js';

export function shotName() {
  const m = /[?&]shot=([a-z]+)/.exec(window.location.search || '');
  return m ? m[1] : null;
}

// Place a car of a given type near the player and put the player in it.
function giveCar(G, type, x, y, angle) {
  const car = makeCar(type, x, y, angle, 'player');
  car.speed = 0;
  G.cars.push(car);
  const p = G.player;
  p.car = car; p.onFoot = false;
  p.x = x; p.y = y; p.angle = angle;
  return car;
}

export function applyShot(G, name) {
  G.shot = name;
  const p = G.player;
  if (name === 'start') {
    G.mode = 'title';
    G.dayTime = 0.1;
    return;
  }
  if (name === 'play') {
    G.mode = 'play';
    G.dayTime = 0.25; // high noon
    p.x = 1200; p.y = 210;
    const car = giveCar(G, 'sedan', 1200, 210, 0);
    car.speed = 240;
    car.color = '#b8433a';
    // A couple of traffic cars on the highway for life.
    const t1 = makeCar('pickup', 930, 210, 0, 'traffic');
    t1.speed = 130; G.cars.push(t1);
    const t2 = makeCar('motor', 1500, 235, 0, 'traffic');
    t2.speed = 150; G.cars.push(t2);
    G.mission.start(G);
    G.mission.dialogue = null;
    return;
  }
  if (name === 'chase') {
    G.mode = 'play';
    G.dayTime = 0.5; // dusk
    G.wanted = 3;
    p.x = 1600; p.y = 1200;
    const car = giveCar(G, 'pickup', 1600, 1200, Math.PI / 2);
    car.speed = 260;
    car.color = '#3a6ea5';
    // Three sheriff cars closing in.
    const c1 = makeSheriffCar(1420, 1050, 0.6); c1.speed = 300; c1.flashT = 0;
    const c2 = makeSheriffCar(1780, 1080, 2.4); c2.speed = 300; c2.flashT = 0.4;
    const c3 = makeSheriffCar(1600, 880, 1.5); c3.speed = 320; c3.flashT = 0.8;
    G.police.push(c1, c2, c3);
    // A roadblock ahead on Spur Avenue.
    G.roadblocks.push({ x: 1600, y: 1500, vertical: true, t: 0 });
    G.addMessage('ROADBLOCK AHEAD — sheriff barricade on the road!');
    G.mission.start(G);
    G.mission.dialogue = null;
    return;
  }
  if (name === 'mission') {
    G.mode = 'play';
    G.dayTime = 0.45; // golden hour
    p.x = 1560; p.y = 1180;
    p.angle = Math.PI / 2;
    // Mission 5 (Casino Lights) mid-dialogue at the Desert Rose.
    G.mission.idx = 4;
    G.mission.stage = 0;
    G.mission.dialogue = {
      lines: [
        'VERA: The Desert Rose owes me chips. The Lucky Coyote owes me more.',
        'VERA: Carry my chips down the strip. Smile at the cameras. Do not stop.',
        'ROOK: Two casinos, one bag of chips. What could go wrong?',
      ],
      i: 1,
    };
    p.cash = 2140;
    p.debt = 1250;
    // Rook on foot on the strip, his green sedan parked beside him.
    const parked = makeCar('sedan', 1500, 1230, Math.PI / 2, 'parked');
    parked.color = '#4a8f7a';
    G.cars.push(parked);
    // A sheriff cruising the strip for flavour.
    const c1 = makeSheriffCar(1740, 1000, -0.4); c1.speed = 120; c1.flashT = 0.2;
    G.police.push(c1);
    return;
  }
  G.mode = 'title';
}

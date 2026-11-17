// Vehicles: five stealable types, traffic on three loops, driving physics,
// stealing (E), entering/exiting, and car-vs-building collision.
import { VEHICLE_TYPES, SHERIFF_CAR, WORLD } from './config.js';
import { mulberry32, pick, range, angleDiff, clamp } from './rng.js';
import { collideBuildings } from './world.js';

let carId = 1;

export function makeCar(type, x, y, angle, kind) {
  const t = VEHICLE_TYPES[type] || VEHICLE_TYPES.sedan;
  return {
    id: carId++, type, kind: kind || 'traffic',
    x, y, angle, speed: 0,
    top: t.top, accel: t.accel, turn: t.turn, len: t.len, wid: t.wid,
    color: t.color, parked: kind === 'parked',
    loop: 0, wp: 0, stopT: 0, hornT: 0,
  };
}

export function makeSheriffCar(x, y, angle) {
  const c = makeCar('sedan', x, y, angle, 'police');
  c.top = SHERIFF_CAR.top; c.accel = SHERIFF_CAR.accel; c.turn = SHERIFF_CAR.turn;
  c.len = SHERIFF_CAR.len; c.wid = SHERIFF_CAR.wid;
  c.color = '#f2efe6';
  return c;
}

export function spawnTraffic(G) {
  const rng = mulberry32(G.world.seed + 77);
  const types = Object.keys(VEHICLE_TYPES);
  G.cars = [];
  // Moving traffic, spread over the three loops.
  for (let i = 0; i < 15; i++) {
    const loop = i % G.world.loops.length;
    const path = G.world.loops[loop];
    const wp = Math.floor(rng() * path.length);
    const pt = path[wp];
    const car = makeCar(pick(rng, types), pt.x + range(rng, -20, 20), pt.y + range(rng, -20, 20), 0, 'traffic');
    car.loop = loop; car.wp = (wp + 1) % path.length;
    car.speed = range(rng, 90, 150);
    G.cars.push(car);
  }
  // Parked, stealable cars (includes the mission sedan and Vera's van).
  for (const s of G.world.parkSpots) {
    const car = makeCar(s.type, s.x, s.y, range(rng, 0, Math.PI * 2), 'parked');
    car.color = s.color;
    G.cars.push(car);
  }
}

function steerToward(car, tx, ty, dt, reverse) {
  const want = Math.atan2(ty - car.y, tx - car.x);
  const d = angleDiff(car.angle, want);
  car.angle += clamp(d, -car.turn * dt, car.turn * dt) * (reverse ? -1 : 1);
  return d;
}

export function updateTraffic(G, dt) {
  for (const car of G.cars) {
    if (car.kind !== 'traffic') continue;
    const path = G.world.loops[car.loop];
    const target = path[car.wp];
    const dx = target.x - car.x, dy = target.y - car.y;
    const d = Math.hypot(dx, dy);
    if (d < 26) { car.wp = (car.wp + 1) % path.length; continue; }
    // Stop for a car directly ahead (player or traffic).
    let blocked = false;
    for (const o of G.cars) {
      if (o === car || o.kind === 'parked') continue;
      const ox = o.x - car.x, oy = o.y - car.y;
      const along = ox * Math.cos(car.angle) + oy * Math.sin(car.angle);
      const side = Math.abs(-ox * Math.sin(car.angle) + oy * Math.cos(car.angle));
      if (along > 0 && along < 70 && side < 26) { blocked = true; break; }
    }
    const p = G.player;
    if (p.car) {
      const ox = p.car.x - car.x, oy = p.car.y - car.y;
      const along = ox * Math.cos(car.angle) + oy * Math.sin(car.angle);
      const side = Math.abs(-ox * Math.sin(car.angle) + oy * Math.cos(car.angle));
      if (along > 0 && along < 70 && side < 26) blocked = true;
    }
    car.stopT = blocked ? car.stopT + dt : 0;
    const wantSpeed = blocked ? 0 : 120;
    car.speed += clamp(wantSpeed - car.speed, -260 * dt, 150 * dt);
    steerToward(car, target.x, target.y, dt, false);
    car.x += Math.cos(car.angle) * car.speed * dt;
    car.y += Math.sin(car.angle) * car.speed * dt;
  }
}

// Player driving the car they are in.
export function updateDriving(G, dt, input) {
  const p = G.player;
  if (p.onFoot || !p.car) return;
  const car = p.car;
  const fwd = input.down('KeyW', 'ArrowUp');
  const back = input.down('KeyS', 'ArrowDown');
  const left = input.down('KeyA', 'ArrowLeft');
  const right = input.down('KeyD', 'ArrowRight');
  if (fwd) car.speed += car.accel * dt;
  else if (back) car.speed -= car.speed > 5 ? car.accel * 1.4 * dt : car.accel * 0.6 * dt;
  else car.speed -= Math.sign(car.speed) * Math.min(Math.abs(car.speed), 140 * dt);
  if (input.down('Space')) car.speed -= Math.sign(car.speed) * Math.min(Math.abs(car.speed), 420 * dt);
  car.speed = clamp(car.speed, -car.top * 0.45, car.top);
  const steer = (left ? -1 : 0) + (right ? 1 : 0);
  if (steer !== 0 && Math.abs(car.speed) > 8) {
    car.angle += steer * car.turn * dt * (car.speed >= 0 ? 1 : -1) * Math.min(1, Math.abs(car.speed) / 120);
  }
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  const c = collideBuildings(G.world, nx, ny, car.len / 2 - 4);
  if (c.hit) car.speed *= 0.45;
  car.x = clamp(c.x, 30, WORLD.w - 30);
  car.y = clamp(c.y, 30, WORLD.h - 30);
  p.x = car.x; p.y = car.y; p.angle = car.angle;
  // Nudge traffic cars we ram.
  for (const o of G.cars) {
    if (o === car || o.kind === 'parked') continue;
    const dx = o.x - car.x, dy = o.y - car.y;
    const d = Math.hypot(dx, dy);
    if (d < 48 && d > 0.1 && Math.abs(car.speed) > 60) {
      o.x += (dx / d) * 26; o.y += (dy / d) * 26;
      o.speed = Math.max(o.speed, 40);
    }
  }
  G.audio.setEngine(Math.abs(car.speed) / car.top, true);
}

export function nearestCar(G, maxDist) {
  const p = G.player;
  let best = null, bestD = maxDist;
  for (const car of G.cars) {
    if (car.kind === 'police') continue;
    const d = Math.hypot(car.x - p.x, car.y - p.y);
    if (d < bestD) { bestD = d; best = car; }
  }
  return best;
}

// E near a car: enter it (stealing a parked/traffic car raises wanted).
export function tryEnterCar(G) {
  const p = G.player;
  if (!p.onFoot) {
    // Exit current car.
    const car = p.car;
    p.car = null; p.onFoot = true;
    p.x = car.x + Math.cos(car.angle + Math.PI / 2) * 34;
    p.y = car.y + Math.sin(car.angle + Math.PI / 2) * 34;
    car.speed = 0;
    G.audio.setEngine(0, false);
    return 'exit';
  }
  const car = nearestCar(G, 70);
  if (!car) return null;
  if (car.kind === 'parked' || car.kind === 'traffic') {
    if (car.kind === 'traffic' && car.speed > 5) return 'moving';
    p.car = car; p.onFoot = false;
    car.kind = 'player';
    car.parked = false;
    G.wanted = Math.min(5, G.wanted + 1);
    G.wantedTimer = 0;
    G.stats.carsStolen++;
    G.audio.click();
    return 'steal';
  }
  return null;
}

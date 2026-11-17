// 26 pedestrians wandering the sidewalks of Copperhead County.
import { PED_COUNT, WORLD } from './config.js';
import { mulberry32, pick, range, rangeInt, clamp } from './rng.js';
import { collideBuildings, onRoadPoint } from './world.js';

const SHIRTS = ['#c94f4f', '#4f7dc9', '#5aa85a', '#c9a24f', '#8a5fc9', '#4fb8c9', '#d97b4f', '#7d8a99'];
const SKINS = ['#e8b98a', '#c98a5e', '#8a5e3a', '#f0c9a0'];

export function spawnPedestrians(G) {
  const rng = mulberry32(G.world.seed + 31);
  G.peds = [];
  let guard = 0;
  while (G.peds.length < PED_COUNT && guard++ < 4000) {
    const x = range(rng, 80, WORLD.w - 80);
    const y = range(rng, 80, WORLD.h - 80);
    if (onRoadPoint(x, y)) continue;
    if (G.world.buildings.some(b => x > b.x - 20 && x < b.x + b.w + 20 && y > b.y - 20 && y < b.y + b.h + 20)) continue;
    G.peds.push({
      x, y, tx: x, ty: y, angle: range(rng, 0, Math.PI * 2),
      speed: range(rng, 28, 52), shirt: pick(rng, SHIRTS), skin: pick(rng, SKINS),
      hp: 30, waitT: range(rng, 0, 3), walkPhase: range(rng, 0, 6.28),
      scared: 0, dead: false,
    });
  }
}

function pickTarget(G, ped, rng) {
  // Walk to a nearby sidewalk point (just off a road).
  for (let tries = 0; tries < 12; tries++) {
    const a = range(rng, 0, Math.PI * 2);
    const d = range(rng, 120, 420);
    const x = clamp(ped.x + Math.cos(a) * d, 60, WORLD.w - 60);
    const y = clamp(ped.y + Math.sin(a) * d, 60, WORLD.h - 60);
    if (onRoadPoint(x, y)) continue;
    if (G.world.buildings.some(b => x > b.x - 16 && x < b.x + b.w + 16 && y > b.y - 16 && y < b.y + b.h + 16)) continue;
    ped.tx = x; ped.ty = y;
    return;
  }
  ped.waitT = 2;
}

export function updatePedestrians(G, dt) {
  const rng = G.pedRng;
  const p = G.player;
  for (const ped of G.peds) {
    if (ped.dead) continue;
    ped.scared = Math.max(0, ped.scared - dt);
    ped.waitT = Math.max(0, ped.waitT - dt);
    // Flee from gunfire or a speeding car nearby.
    const threat = G.bullets.length > 0 && Math.hypot(ped.x - p.x, ped.y - p.y) < 320;
    const carNear = p.car && Math.hypot(ped.x - p.car.x, ped.y - p.car.y) < 90 && Math.abs(p.car.speed) > 120;
    if ((threat || carNear) && ped.scared <= 0) {
      ped.scared = 2.5;
      const a = Math.atan2(ped.y - p.y, ped.x - p.x);
      ped.tx = clamp(ped.x + Math.cos(a) * 260, 60, WORLD.w - 60);
      ped.ty = clamp(ped.y + Math.sin(a) * 260, 60, WORLD.h - 60);
    }
    const dx = ped.tx - ped.x, dy = ped.ty - ped.y;
    const d = Math.hypot(dx, dy);
    if (d < 14 || ped.waitT > 0) {
      if (ped.waitT <= 0 && d < 14) {
        ped.waitT = range(rng, 0.5, 3);
        pickTarget(G, ped, rng);
      }
      continue;
    }
    const spd = ped.speed * (ped.scared > 0 ? 2.4 : 1);
    ped.x += (dx / d) * spd * dt;
    ped.y += (dy / d) * spd * dt;
    ped.angle = Math.atan2(dy, dx);
    ped.walkPhase += dt * (ped.scared > 0 ? 14 : 7);
    const c = collideBuildings(G.world, ped.x, ped.y, 11);
    ped.x = c.x; ped.y = c.y;
    // Run over by a car: knocked down, raises wanted.
    if (p.car && Math.hypot(ped.x - p.car.x, ped.y - p.car.y) < 26 && Math.abs(p.car.speed) > 90) {
      killPed(G, ped, 'run over');
    }
  }
}

export function killPed(G, ped, how) {
  if (ped.dead) return;
  ped.dead = true;
  G.wanted = Math.min(5, G.wanted + 2);
  G.wantedTimer = 0;
  G.stats.pedsDown++;
  G.addMessage('Pedestrian ' + how + ' — wanted up!');
  G.spawnParticles(ped.x, ped.y, '#c94f4f', 10);
}

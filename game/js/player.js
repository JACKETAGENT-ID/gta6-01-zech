// Rook Calloway on foot: walk, sprint, dodge, enter/steal cars, interact.
import { WORLD } from './config.js';
import { clamp, angleDiff } from './rng.js';
import { collideBuildings } from './world.js';

export function makePlayer(x, y) {
  return {
    x, y, angle: -Math.PI / 2, speed: 0,
    hp: 100, maxHp: 100, ammo: 24, cash: 150, debt: 4000,
    onFoot: true, car: null, sprint: false,
    dodgeT: 0, punchT: 0, hurtT: 0, deadT: 0,
    aimAngle: 0,
  };
}

export function updatePlayer(G, dt, input) {
  const p = G.player;
  if (!p.onFoot) return;
  p.hurtT = Math.max(0, p.hurtT - dt);
  p.punchT = Math.max(0, p.punchT - dt);
  p.dodgeT = Math.max(0, p.dodgeT - dt);

  let mx = 0, my = 0;
  if (input.down('KeyW', 'ArrowUp')) my -= 1;
  if (input.down('KeyS', 'ArrowDown')) my += 1;
  if (input.down('KeyA', 'ArrowLeft')) mx -= 1;
  if (input.down('KeyD', 'ArrowRight')) mx += 1;
  const moving = mx !== 0 || my !== 0;
  p.sprint = input.down('ShiftLeft', 'ShiftRight') && moving;
  const spd = p.dodgeT > 0 ? 520 : p.sprint ? 260 : 175;
  if (moving) {
    const len = Math.hypot(mx, my);
    const nx = mx / len, ny = my / len;
    p.x += nx * spd * dt;
    p.y += ny * spd * dt;
    const target = Math.atan2(ny, nx);
    p.angle += angleDiff(p.angle, target) * Math.min(1, dt * 14);
    p.speed = spd;
  } else {
    p.speed = 0;
  }
  // Dodge roll on Space.
  if (input.pressed('Space') && p.dodgeT <= 0) p.dodgeT = 0.28;
  // Aim follows the mouse (world coords).
  const wx = G.camera.x + input.mouse.x - 640;
  const wy = G.camera.y + input.mouse.y - 360;
  p.aimAngle = Math.atan2(wy - p.y, wx - p.x);

  // Keep inside the world and out of buildings.
  p.x = clamp(p.x, 24, WORLD.w - 24);
  p.y = clamp(p.y, 24, WORLD.h - 24);
  const c = collideBuildings(G.world, p.x, p.y, 14);
  p.x = c.x; p.y = c.y;
}

export function hurtPlayer(G, dmg) {
  const p = G.player;
  if (p.hurtT > 0 || G.mode !== 'play') return;
  p.hp -= dmg;
  p.hurtT = 0.6;
  if (p.hp <= 0) {
    p.hp = 0;
    G.mode = 'wasted';
    G.audio.busted();
    G.stats.deaths++;
  }
}

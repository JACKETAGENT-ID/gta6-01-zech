// Wanted system: 0-5 stars, sheriff cars chase, roadblocks at 3+ stars,
// and arrest when a sheriff catches Rook standing still or on foot.
import { WORLD, ROADS_X, ROADS_Y } from './config.js';
import { clamp, angleDiff } from './rng.js';
import { makeSheriffCar } from './vehicles.js';
import { collideBuildings } from './world.js';

export function wantedTarget(G) {
  return Math.min(5, G.wanted);
}

export function updatePolice(G, dt) {
  const p = G.player;
  // Wanted decays slowly when no crime has happened lately.
  if (G.wanted > 0) {
    G.wantedTimer += dt;
    if (G.wantedTimer > 28) {
      G.wanted--;
      G.wantedTimer = 0;
      if (G.wanted === 0) G.addMessage('The heat is off. For now.');
    }
  }
  // Spawn sheriff cars up to the wanted level.
  const cops = G.police.filter(c => c.kind === 'police');
  if (cops.length < wantedTarget(G) && G.spawnCooldown <= 0) {
    const a = Math.random() * Math.PI * 2;
    const sx = clamp(p.x + Math.cos(a) * 700, 80, WORLD.w - 80);
    const sy = clamp(p.y + Math.sin(a) * 700, 80, WORLD.h - 80);
    const cop = makeSheriffCar(sx, sy, 0);
    cop.speed = 200;
    G.police.push(cop);
    G.spawnCooldown = 4;
  }
  G.spawnCooldown = Math.max(0, G.spawnCooldown - dt);

  // Chase: steer toward the player, ram on contact.
  for (const cop of G.police) {
    const dx = p.x - cop.x, dy = p.y - cop.y;
    const d = Math.hypot(dx, dy);
    const want = Math.atan2(dy, dx);
    cop.angle += clamp(angleDiff(cop.angle, want), -cop.turn * dt, cop.turn * dt);
    const targetSpeed = d > 420 ? cop.top : d > 120 ? cop.top * 0.85 : cop.top * 0.55;
    cop.speed += clamp(targetSpeed - cop.speed, -320 * dt, 260 * dt);
    const nx = cop.x + Math.cos(cop.angle) * cop.speed * dt;
    const ny = cop.y + Math.sin(cop.angle) * cop.speed * dt;
    const c = collideBuildings(G.world, nx, ny, cop.len / 2 - 4);
    if (c.hit) cop.speed *= 0.5;
    cop.x = clamp(c.x, 30, WORLD.w - 30);
    cop.y = clamp(c.y, 30, WORLD.h - 30);
    cop.flashT = (cop.flashT || 0) + dt;
    // Ram the player's car or tackle Rook on foot.
    if (d < 46) {
      if (p.onFoot) {
        cop.arrestT = (cop.arrestT || 0) + dt;
        if (cop.arrestT > 1.2) { arrestPlayer(G); return; }
      } else if (Math.abs(p.car.speed) < 25) {
        cop.arrestT = (cop.arrestT || 0) + dt;
        if (cop.arrestT > 2.0) { arrestPlayer(G); return; }
      } else {
        cop.arrestT = 0;
        p.car.speed *= 0.94;
        G.spawnParticles(cop.x, cop.y, '#ffd23c', 3);
      }
    } else {
      cop.arrestT = 0;
    }
  }
  // Remove cops once the wanted level drops to zero.
  if (G.wanted === 0) {
    G.police = G.police.filter(c => {
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      return d < 500; // keep nearby ones briefly so they drive off
    });
    if (G.police.length > 0 && Math.random() < dt * 0.2) G.police.shift();
  }

  updateRoadblocks(G, dt);
}

function arrestPlayer(G) {
  const p = G.player;
  const fine = Math.min(200, Math.floor(p.cash * 0.25));
  p.cash -= fine;
  p.hp = 100;
  G.wanted = 0;
  G.police = [];
  G.roadblocks = [];
  if (p.car) { p.car = null; p.onFoot = true; }
  p.x = 1220; p.y = 480; // sheriff office steps
  G.mode = 'busted';
  G.audio.busted();
  G.stats.busted++;
  G.bustedFine = fine;
}

function updateRoadblocks(G, dt) {
  if (G.wanted < 3) { G.roadblocks = []; return; }
  G.roadblockTimer -= dt;
  if (G.roadblockTimer <= 0 && G.roadblocks.length < 2) {
    // Block the road ahead of the player.
    const p = G.player;
    const ahead = p.car ? p.car.angle : p.angle;
    const bx = clamp(p.x + Math.cos(ahead) * 420, 100, WORLD.w - 100);
    const by = clamp(p.y + Math.sin(ahead) * 420, 100, WORLD.h - 100);
    // Snap to the nearest road axis.
    let rx = ROADS_X[0], ry = ROADS_Y[0];
    for (const x of ROADS_X) if (Math.abs(x - bx) < Math.abs(rx - bx)) rx = x;
    for (const y of ROADS_Y) if (Math.abs(y - by) < Math.abs(ry - by)) ry = y;
    const vertical = Math.abs(rx - bx) < Math.abs(ry - by);
    G.roadblocks.push({
      x: vertical ? rx : bx, y: vertical ? by : ry,
      vertical, t: 0,
    });
    G.roadblockTimer = 14;
    G.addMessage('ROADBLOCK AHEAD — sheriff barricade on the road!');
  }
  for (const rb of G.roadblocks) rb.t += dt;
  // Smashing through a roadblock in a car.
  const p = G.player;
  if (p.car) {
    for (const rb of G.roadblocks) {
      const dx = p.car.x - rb.x, dy = p.car.y - rb.y;
      const hit = rb.vertical
        ? Math.abs(dx) < 40 && Math.abs(dy) < 90
        : Math.abs(dx) < 90 && Math.abs(dy) < 40;
      if (hit && Math.abs(p.car.speed) > 140) {
        G.roadblocks = G.roadblocks.filter(r => r !== rb);
        p.car.speed *= 0.55;
        G.spawnParticles(rb.x, rb.y, '#ff8c3c', 16);
        G.addMessage('You smashed through the roadblock!');
        G.wanted = Math.min(5, G.wanted + 1);
        break;
      }
    }
  }
}

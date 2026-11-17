// Combat: pistol (mouse aim, click to shoot) and punching (F).
// Bullets hit pedestrians, sheriff cars and traffic; crime raises wanted.
import { WORLD } from './config.js';
import { killPed } from './pedestrians.js';

export function updateCombat(G, dt, input) {
  const p = G.player;
  // Pistol: hold/click to fire toward the mouse.
  if (input.mouse.down && G.mode === 'play') {
    G.fireCooldown -= dt;
    if (G.fireCooldown <= 0 && p.ammo > 0) {
      p.ammo--;
      G.fireCooldown = 0.22;
      const a = p.aimAngle;
      G.bullets.push({
        x: p.x + Math.cos(a) * 22, y: p.y + Math.sin(a) * 22,
        vx: Math.cos(a) * 900, vy: Math.sin(a) * 900, life: 0.7,
      });
      G.audio.shoot();
      G.spawnParticles(p.x + Math.cos(a) * 26, p.y + Math.sin(a) * 26, '#ffd23c', 3);
    }
  } else {
    G.fireCooldown = Math.max(0, G.fireCooldown - dt);
  }
  // Punch: F key, hits the nearest ped or sheriff in front.
  if (input.pressed('KeyF') && p.punchT <= 0) {
    p.punchT = 0.35;
    G.audio.punch();
    const fx = p.x + Math.cos(p.aimAngle) * 30;
    const fy = p.y + Math.sin(p.aimAngle) * 30;
    for (const ped of G.peds) {
      if (!ped.dead && Math.hypot(ped.x - fx, ped.y - fy) < 34) {
        ped.hp -= 20;
        ped.scared = 2;
        if (ped.hp <= 0) killPed(G, ped, 'punched down');
        else G.addMessage('You punched a pedestrian!');
        break;
      }
    }
    for (const cop of G.police) {
      if (Math.hypot(cop.x - fx, cop.y - fy) < 40) {
        G.wanted = Math.min(5, G.wanted + 1);
        G.wantedTimer = 0;
        G.addMessage('You struck a deputy!');
        break;
      }
    }
  }

  // Move bullets and resolve hits.
  for (const b of G.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0 || b.x < 0 || b.x > WORLD.w || b.y < 0 || b.y > WORLD.h) continue;
    for (const ped of G.peds) {
      if (!ped.dead && Math.hypot(ped.x - b.x, ped.y - b.y) < 14) {
        ped.hp -= 34;
        b.life = 0;
        G.spawnParticles(b.x, b.y, '#c94f4f', 6);
        if (ped.hp <= 0) killPed(G, ped, 'shot');
        else { G.wanted = Math.min(5, G.wanted + 1); G.wantedTimer = 0; ped.scared = 3; }
        break;
      }
    }
    if (b.life <= 0) continue;
    for (const cop of G.police) {
      if (Math.hypot(cop.x - b.x, cop.y - b.y) < 26) {
        b.life = 0;
        cop.speed *= 0.7;
        G.wanted = Math.min(5, G.wanted + 1);
        G.wantedTimer = 0;
        G.spawnParticles(b.x, b.y, '#ffd23c', 6);
        break;
      }
    }
    if (b.life <= 0) continue;
    for (const car of G.cars) {
      if (car.kind === 'player') continue;
      if (Math.hypot(car.x - b.x, car.y - b.y) < 30) {
        b.life = 0;
        G.spawnParticles(b.x, b.y, '#c9c9c9', 4);
        break;
      }
    }
  }
  G.bullets = G.bullets.filter(b => b.life > 0);
}

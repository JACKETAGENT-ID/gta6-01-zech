// Canvas renderer: desert ground, roads, highway, buildings with neon casino
// signs, cars, pedestrians, nuggets, bullets, particles, day-cycle tint
// and dust-storm haze. Everything is drawn with code — no image assets.
import { WORLD, PALETTE, ROADS_X, ROADS_Y, ROAD_W, HIGHWAY_Y, HIGHWAY_W } from './config.js';
import { missionMarker } from './missions.js';

export function drawWorld(ctx, G) {
  const cam = G.camera;
  const vx = cam.x - 640, vy = cam.y - 360;
  ctx.save();
  ctx.translate(-vx, -vy);
  drawGround(ctx, G, vx, vy);
  drawRoads(ctx, G);
  drawBuildings(ctx, G);
  drawNuggets(ctx, G);
  drawPeds(ctx, G);
  drawCars(ctx, G);
  drawPolice(ctx, G);
  drawPlayer(ctx, G);
  drawBullets(ctx, G);
  drawParticles(ctx, G);
  drawMissionMarker(ctx, G);
  ctx.restore();
  // Day-cycle tint + dust storm haze on top of the world (not the HUD).
  drawSkyTint(ctx, G);
  if (G.storm.active) drawStorm(ctx, G);
  // Vignette.
  const vg = ctx.createRadialGradient(640, 360, 320, 640, 360, 780);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(20,8,2,0.28)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, 1280, 720);
}

function drawGround(ctx, G, vx, vy) {
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(vx, vy, 1280, 720);
  // Sand texture: deterministic speckles.
  ctx.fillStyle = PALETTE.sandDark;
  const step = 90;
  const x0 = Math.floor(vx / step) * step, y0 = Math.floor(vy / step) * step;
  for (let x = x0; x < vx + 1280 + step; x += step) {
    for (let y = y0; y < vy + 720 + step; y += step) {
      const h = ((x * 31 + y * 17) % 97) / 97;
      if (h > 0.72) {
        ctx.fillStyle = h > 0.88 ? PALETTE.sandLight : PALETTE.dirt;
        ctx.beginPath();
        ctx.ellipse(x + ((x * 7) % 60), y + ((y * 13) % 50), 26 + h * 22, 12 + h * 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // Cacti and rocks outside the road grid.
  ctx.fillStyle = '#4a7d3a';
  for (let i = 0; i < 40; i++) {
    const cx = ((i * 733) % WORLD.w), cy = ((i * 521 + 300) % WORLD.h);
    if (cx < vx - 40 || cx > vx + 1320 || cy < vy - 40 || cy > vy + 760) continue;
    ctx.fillRect(cx, cy - 14, 5, 26);
    ctx.fillRect(cx - 7, cy - 6, 7, 4);
    ctx.fillRect(cx + 5, cy - 10, 7, 4);
  }
}

function drawRoads(ctx, G) {
  ctx.fillStyle = PALETTE.asphalt;
  for (const x of ROADS_X) ctx.fillRect(x - ROAD_W / 2, 0, ROAD_W, WORLD.h);
  for (const y of ROADS_Y) ctx.fillRect(0, y - ROAD_W / 2, WORLD.w, ROAD_W);
  ctx.fillStyle = PALETTE.highway;
  ctx.fillRect(0, HIGHWAY_Y - HIGHWAY_W / 2, WORLD.w, HIGHWAY_W);
  // Lane dashes.
  ctx.fillStyle = PALETTE.asphaltLine;
  for (const x of ROADS_X) {
    for (let y = 40; y < WORLD.h; y += 70) ctx.fillRect(x - 2, y, 4, 30);
  }
  for (const y of ROADS_Y) {
    for (let x = 40; x < WORLD.w; x += 70) ctx.fillRect(x, y - 2, 30, 4);
  }
  for (let x = 30; x < WORLD.w; x += 90) {
    ctx.fillRect(x, HIGHWAY_Y - 2, 44, 4);
    ctx.fillRect(x, HIGHWAY_Y + HIGHWAY_W / 2 - 2, 44, 4);
  }
  // Sidewalks.
  ctx.strokeStyle = PALETTE.sidewalk;
  ctx.lineWidth = 10;
  for (const x of ROADS_X) {
    ctx.beginPath(); ctx.moveTo(x - ROAD_W / 2 - 6, 0); ctx.lineTo(x - ROAD_W / 2 - 6, WORLD.h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + ROAD_W / 2 + 6, 0); ctx.lineTo(x + ROAD_W / 2 + 6, WORLD.h); ctx.stroke();
  }
}

function drawBuildings(ctx, G) {
  const night = G.dayTime > 0.62 || G.dayTime < 0.08;
  for (const b of G.world.buildings) {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    // Roof detail.
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(b.x + 8, b.y + 8, b.w - 16, 10);
    if (night) {
      ctx.fillStyle = '#ffd23c';
      for (let i = 0; i < Math.floor(b.w / 46); i++) {
        ctx.fillRect(b.x + 14 + i * 46, b.y + b.h / 2 - 6, 16, 12);
      }
    }
    if (b.kind === 'casino') {
      // Neon sign with the casino name.
      ctx.fillStyle = b.neon;
      ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.name.toUpperCase(), b.x + b.w / 2, b.y - 12);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
      ctx.fillText('★ CASINO ★', b.x + b.w / 2, b.y + b.h / 2 + 4);
      ctx.textAlign = 'left';
    } else if (b.name) {
      ctx.fillStyle = 'rgba(255,233,196,0.9)';
      ctx.font = 'bold 12px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.name.toUpperCase(), b.x + b.w / 2, b.y - 8);
      ctx.textAlign = 'left';
    }
  }
}

function drawNuggets(ctx, G) {
  for (const n of G.nuggets) {
    if (n.taken) continue;
    const pulse = 1 + Math.sin(n.bob * 4) * 0.25;
    ctx.save();
    ctx.translate(n.x, n.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#f2b234';
    ctx.beginPath();
    ctx.moveTo(0, -10); ctx.lineTo(8, 0); ctx.lineTo(0, 10); ctx.lineTo(-8, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff3c9';
    ctx.beginPath(); ctx.arc(-2, -3, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawPeds(ctx, G) {
  for (const ped of G.peds) {
    if (ped.dead) {
      ctx.fillStyle = 'rgba(60,20,10,0.8)';
      ctx.beginPath(); ctx.ellipse(ped.x, ped.y, 13, 6, ped.angle, 0, Math.PI * 2); ctx.fill();
      continue;
    }
    const bob = Math.sin(ped.walkPhase) * 2;
    ctx.save();
    ctx.translate(ped.x, ped.y + bob * 0.3);
    ctx.rotate(ped.angle);
    ctx.fillStyle = ped.shirt;
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ped.skin;
    ctx.beginPath(); ctx.arc(7, 0, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawCarShape(ctx, car, isPolice) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);
  const l = car.len, w = car.wid;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-l / 2 + 3, -w / 2 + 4, l, w);
  ctx.fillStyle = car.color;
  roundRect(ctx, -l / 2, -w / 2, l, w, 8);
  ctx.fill();
  if (car.type === 'pickup') {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(-l / 2 + 6, -w / 2 + 4, l * 0.32, w - 8);
  } else if (car.type === 'bus') {
    ctx.fillStyle = '#cfe8ff';
    for (let i = 0; i < 4; i++) ctx.fillRect(-l / 2 + 10 + i * 18, -w / 2 + 4, 12, 6);
    ctx.fillRect(-l / 2 + 10, w / 2 - 10, 12, 6);
  } else if (car.type === 'motor') {
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(-l / 2 + 4, 0, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(l / 2 - 4, 0, 5, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#bfe0f2';
    ctx.fillRect(l * 0.08, -w / 2 + 4, l * 0.3, w - 8);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(-l * 0.32, -w / 2 + 3, l * 0.2, w - 6);
  }
  if (isPolice) {
    ctx.fillStyle = '#1c2f57';
    ctx.fillRect(-l * 0.1, -w / 2, l * 0.2, w);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SHERIFF', 0, 3.5);
    ctx.textAlign = 'left';
    const flash = Math.floor((car.flashT || 0) * 6) % 2 === 0;
    ctx.fillStyle = flash ? '#ff3b30' : '#3b7dff';
    ctx.beginPath(); ctx.arc(0, -w / 2 + 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = flash ? '#3b7dff' : '#ff3b30';
    ctx.beginPath(); ctx.arc(8, -w / 2 + 2, 5, 0, Math.PI * 2); ctx.fill();
  }
  // Headlights at night.
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCars(ctx, G) {
  for (const car of G.cars) {
    if (car.kind === 'player') continue; // drawn with the player
    drawCarShape(ctx, car, false);
  }
  if (G.player.car) drawCarShape(ctx, G.player.car, false);
}

function drawPolice(ctx, G) {
  for (const cop of G.police) drawCarShape(ctx, cop, true);
  // Roadblocks: striped barricades.
  for (const rb of G.roadblocks) {
    ctx.save();
    ctx.translate(rb.x, rb.y);
    if (!rb.vertical) ctx.rotate(Math.PI / 2);
    for (let i = -2; i <= 2; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#ff5f4f' : '#fff';
      ctx.fillRect(-8, i * 16, 16, 16);
    }
    ctx.strokeStyle = '#1c2f57';
    ctx.lineWidth = 2;
    ctx.strokeRect(-8, -40, 16, 80);
    ctx.restore();
  }
}

function drawPlayer(ctx, G) {
  const p = G.player;
  if (!p.onFoot) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(0, 3, 13, 7, 0, 0, Math.PI * 2); ctx.fill();
  // Body: green jacket, Rook's signature.
  ctx.fillStyle = PALETTE.playerJacket;
  ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTE.playerSkin;
  ctx.beginPath(); ctx.arc(8, 0, 6.5, 0, Math.PI * 2); ctx.fill();
  // Pistol in hand when aiming with mouse.
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(18, 0); ctx.stroke();
  ctx.restore();
  // Aim line (short, subtle).
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(p.x + Math.cos(p.aimAngle) * 22, p.y + Math.sin(p.aimAngle) * 22);
  ctx.lineTo(p.x + Math.cos(p.aimAngle) * 40, p.y + Math.sin(p.aimAngle) * 40);
  ctx.stroke();
}

function drawBullets(ctx, G) {
  ctx.fillStyle = '#ffd23c';
  for (const b of G.bullets) {
    ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill();
  }
}

function drawParticles(ctx, G) {
  for (const pt of G.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.max);
    ctx.fillStyle = pt.color;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawMissionMarker(ctx, G) {
  const mk = missionMarker(G);
  if (!mk) return;
  const pulse = 1 + Math.sin(G.time * 4) * 0.15;
  ctx.save();
  ctx.translate(mk.x, mk.y);
  ctx.strokeStyle = '#ff5f4f';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(0, 0, mk.r * 0.4 * pulse, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(255,95,79,0.15)';
  ctx.beginPath(); ctx.arc(0, 0, mk.r * 0.4 * pulse, 0, Math.PI * 2); ctx.fill();
  // Beacon column.
  const grad = ctx.createLinearGradient(0, -260, 0, 0);
  grad.addColorStop(0, 'rgba(255,95,79,0)');
  grad.addColorStop(1, 'rgba(255,95,79,0.35)');
  ctx.fillStyle = grad;
  ctx.fillRect(-8, -260, 16, 260);
  ctx.restore();
  // Off-screen direction arrow at the viewport edge.
  const cam = G.camera;
  const vx = cam.x - 640, vy = cam.y - 360;
  if (mk.x < vx + 40 || mk.x > vx + 1240 || mk.y < vy + 40 || mk.y > vy + 680) {
    const cx = Math.max(vx + 50, Math.min(vx + 1230, mk.x));
    const cy = Math.max(vy + 50, Math.min(vy + 670, mk.y));
    const a = Math.atan2(mk.y - cy, mk.x - cx);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.fillStyle = '#ff5f4f';
    ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-10, -11); ctx.lineTo(-10, 11); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

function drawSkyTint(ctx, G) {
  // dayTime 0 = dawn, 0.25 = noon, 0.5 = dusk, 0.75 = deep night.
  const t = G.dayTime;
  let color = null, alpha = 0;
  if (t < 0.12) { color = '255,150,60'; alpha = 0.16 * (1 - t / 0.12); }
  else if (t > 0.42 && t < 0.62) { color = '255,110,40'; alpha = 0.20 * Math.sin((t - 0.42) / 0.2 * Math.PI); }
  else if (t >= 0.62) { color = '10,16,60'; alpha = 0.34 * Math.min(1, (t - 0.62) / 0.13); }
  if (color && alpha > 0.005) {
    ctx.fillStyle = 'rgba(' + color + ',' + alpha.toFixed(3) + ')';
    ctx.fillRect(0, 0, 1280, 720);
  }
  if (t >= 0.62) {
    ctx.fillStyle = 'rgba(255,240,180,0.9)';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.fillText('NIGHT — headlights on, the county sleeps lightly', 16, 700);
  }
}

function drawStorm(ctx, G) {
  ctx.fillStyle = 'rgba(214,138,60,0.20)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = '#e8b06a';
  for (const d of G.storm.particles) {
    ctx.globalAlpha = 0.35 + d.a * 0.4;
    ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffe9c4';
  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.fillText('DUST STORM — visibility low, drive careful', 640 - 170, 60);
}

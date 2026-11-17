// HUD: cash, debt, health, ammo, wanted stars, radio, objective, messages,
// dialogue box, and the minimap (roads, player, police, mission marker).
import { WORLD, PALETTE, RADIO_STATIONS, CONTROLS_TEXT } from './config.js';
import { missionMarker } from './missions.js';

export function drawHUD(ctx, G) {
  const p = G.player;
  ctx.textBaseline = 'alphabetic';
  // Top-left panel: cash, debt, health, ammo.
  panel(ctx, 14, 12, 250, 108);
  ctx.fillStyle = PALETTE.uiAccent;
  ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
  ctx.fillText('$' + p.cash.toLocaleString('en-US'), 28, 40);
  ctx.fillStyle = p.debt > 0 ? '#ff8c7a' : '#7ad98a';
  ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
  ctx.fillText(p.debt > 0 ? 'DEBT TO VERA: $' + p.debt.toLocaleString('en-US') : 'DEBT PAID OFF!', 28, 62);
  // Health bar.
  ctx.fillStyle = '#3a1410';
  ctx.fillRect(28, 72, 180, 12);
  ctx.fillStyle = p.hp > 50 ? '#7ad98a' : p.hp > 25 ? '#ffc93c' : '#ff5f4f';
  ctx.fillRect(28, 72, 180 * (p.hp / p.maxHp), 12);
  ctx.fillStyle = PALETTE.uiText;
  ctx.font = '12px "Trebuchet MS", sans-serif';
  ctx.fillText('HP ' + Math.ceil(p.hp) + '   AMMO ' + p.ammo + (p.car ? '   ' + p.car.type.toUpperCase() + ' ' + Math.round(Math.abs(p.car.speed) * 0.18) + ' mph' : ''), 28, 102);

  // Top-right: wanted stars.
  panel(ctx, 1280 - 14 - 210, 12, 210, 68);
  ctx.fillStyle = PALETTE.uiText;
  ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
  ctx.fillText('WANTED', 1280 - 210, 32);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < G.wanted ? '#ffc93c' : 'rgba(255,255,255,0.18)';
    drawStar(ctx, 1280 - 200 + i * 34, 48, i < G.wanted);
  }
  if (G.wanted > 0) {
    ctx.fillStyle = '#ff8c7a';
    ctx.font = '11px "Trebuchet MS", sans-serif';
    ctx.fillText(G.wanted >= 3 ? 'ROADBLOCKS ACTIVE' : 'SHERIFF ON YOUR TAIL', 1280 - 210, 74);
  }

  // Bottom-center: current objective.
  const obj = G.mission.objectiveText();
  ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
  const ow = ctx.measureText(obj).width;
  panel(ctx, 640 - ow / 2 - 16, 720 - 92, ow + 32, 34);
  ctx.fillStyle = PALETTE.uiAccent;
  ctx.fillText(obj, 640 - ow / 2, 720 - 69);
  // Mission name + timer.
  const m = G.mission.current();
  if (m && !G.mission.done) {
    ctx.fillStyle = PALETTE.uiText;
    ctx.font = '13px "Trebuchet MS", sans-serif';
    const mt = 'MISSION ' + (G.mission.idx + 1) + '/6 — ' + m.name + '  •  ' + m.giver;
    ctx.fillText(mt, 640 - ctx.measureText(mt).width / 2, 720 - 100);
    const s = G.mission.stageDef();
    if (s && s.timer && G.mission.stageTimer > 0) {
      ctx.fillStyle = G.mission.stageTimer < 10 ? '#ff8c7a' : PALETTE.uiText;
      ctx.font = 'bold 18px "Trebuchet MS", sans-serif';
      const tt = Math.ceil(G.mission.stageTimer) + 's';
      ctx.fillText(tt, 640 - ctx.measureText(tt).width / 2, 720 - 122);
    }
  }

  // Bottom-right: radio station.
  const st = RADIO_STATIONS[G.audio.station];
  ctx.fillStyle = PALETTE.uiText;
  ctx.font = '12px "Trebuchet MS", sans-serif';
  const rt = (G.audio.radioOn ? '♪ ' : '♪ muted ') + st.name;
  ctx.fillText(rt, 1280 - 16 - ctx.measureText(rt).width, 720 - 176);

  drawMessages(ctx, G);
  drawMinimap(ctx, G);
  if (G.mission.dialogue) drawDialogue(ctx, G);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = PALETTE.uiPanel;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,201,60,0.45)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
}

function drawStar(ctx, x, y, lit) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 11 : 4.5;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = lit ? '#ffc93c' : 'rgba(255,255,255,0.18)';
  ctx.fill();
  ctx.restore();
}

function drawMessages(ctx, G) {
  ctx.font = '13px "Trebuchet MS", sans-serif';
  let y = 140;
  for (const msg of G.messages.slice(-4)) {
    ctx.fillStyle = 'rgba(20,12,6,0.7)';
    const w = ctx.measureText(msg.text).width + 16;
    ctx.fillRect(14, y - 14, w, 20);
    ctx.fillStyle = PALETTE.uiText;
    ctx.fillText(msg.text, 22, y);
    y += 24;
  }
}

export function drawMinimap(ctx, G) {
  const mw = 220, mh = 165, mx = 14, my = 720 - mh - 14;
  const sx = mw / WORLD.w, sy = mh / WORLD.h;
  panel(ctx, mx, my, mw, mh);
  ctx.save();
  ctx.beginPath(); ctx.rect(mx, my, mw, mh); ctx.clip();
  ctx.fillStyle = '#c78f4a';
  ctx.fillRect(mx, my, mw, mh);
  // Roads.
  ctx.fillStyle = '#4a4642';
  for (const r of G.world.roads) ctx.fillRect(mx + r.x * sx, my + r.y * sy, Math.max(2, r.w * sx), Math.max(2, r.h * sy));
  // Casinos.
  for (const c of G.world.buildings) {
    if (c.kind !== 'casino') continue;
    ctx.fillStyle = c.neon;
    ctx.fillRect(mx + c.x * sx, my + c.y * sy, c.w * sx, c.h * sy);
  }
  // Nuggets left.
  ctx.fillStyle = '#f2b234';
  for (const n of G.nuggets) {
    if (!n.taken) ctx.fillRect(mx + n.x * sx - 1, my + n.y * sy - 1, 2, 2);
  }
  // Mission marker.
  const mk = missionMarker(G);
  if (mk) {
    ctx.fillStyle = '#ff5f4f';
    ctx.beginPath();
    ctx.arc(mx + mk.x * sx, my + mk.y * sy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.stroke();
  }
  // Police.
  ctx.fillStyle = '#3a6ea5';
  for (const cop of G.police) ctx.fillRect(mx + cop.x * sx - 2, my + cop.y * sy - 2, 4, 4);
  // Player arrow.
  const p = G.player;
  ctx.save();
  ctx.translate(mx + p.x * sx, my + p.y * sy);
  ctx.rotate(p.angle);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(7, 0); ctx.lineTo(-5, -5); ctx.lineTo(-5, 5); ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.restore();
  ctx.fillStyle = PALETTE.uiText;
  ctx.font = '11px "Trebuchet MS", sans-serif';
  ctx.fillText('COPPERHEAD COUNTY', mx + 6, my + 14);
}

function drawDialogue(ctx, G) {
  const d = G.mission.dialogue;
  const line = d.lines[d.i];
  const boxW = 760, boxH = 96, bx = 640 - boxW / 2, by = 720 - 210;
  panel(ctx, bx, by, boxW, boxH);
  ctx.fillStyle = PALETTE.uiText;
  ctx.font = '16px "Trebuchet MS", sans-serif';
  wrapText(ctx, line, bx + 20, by + 30, boxW - 40, 22);
  ctx.fillStyle = PALETTE.uiAccent;
  ctx.font = '12px "Trebuchet MS", sans-serif';
  const hint = 'Press E to continue  (' + (d.i + 1) + '/' + d.lines.length + ')';
  ctx.fillText(hint, bx + boxW - ctx.measureText(hint).width - 16, by + boxH - 12);
}

export function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = w;
      yy += lineH;
    } else line = test;
  }
  ctx.fillText(line, x, yy);
}

// ---- Full-screen menus (title / pause / busted / wasted / win) ----
export function drawTitle(ctx, G) {
  ctx.fillStyle = '#241407';
  ctx.fillRect(0, 0, 1280, 720);
  // Desert sunset bands.
  const grad = ctx.createLinearGradient(0, 0, 0, 720);
  grad.addColorStop(0, '#ff9a3c'); grad.addColorStop(0.45, '#e07b39');
  grad.addColorStop(0.7, '#8a4a2a'); grad.addColorStop(1, '#3a1c0e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = '#ffd23c';
  ctx.beginPath(); ctx.arc(1130, 130, 55, 0, Math.PI * 2); ctx.fill();
  // Mesa silhouettes.
  ctx.fillStyle = '#5e2f16';
  ctx.fillRect(0, 520, 300, 200); ctx.fillRect(240, 470, 260, 250);
  ctx.fillRect(760, 500, 300, 220); ctx.fillRect(1060, 540, 220, 180);
  ctx.fillStyle = '#2a1408';
  ctx.fillRect(0, 600, 1280, 120);
  ctx.fillStyle = '#ffc93c';
  ctx.font = 'bold 84px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('COPPERHEAD', 640, 220);
  ctx.fillStyle = '#ffe9c4';
  ctx.font = 'bold 44px "Trebuchet MS", sans-serif';
  ctx.fillText('C O U N T Y', 640, 275);
  ctx.font = '18px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#ffe9c4';
  ctx.fillText('A desert-county crime story — Rook Calloway owes Vera Voss $4,000.', 640, 330);
  ctx.fillText('Six jobs. One long haul. Get out of debt, or get buried in the sand.', 640, 358);
  ctx.textAlign = 'left';
  drawMenuButtons(ctx, G);
  // Controls.
  ctx.fillStyle = 'rgba(20,12,6,0.75)';
  ctx.fillRect(390, 560, 500, 140);
  ctx.fillStyle = '#ffe9c4';
  ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
  ctx.fillText('HOW TO PLAY', 410, 584);
  ctx.font = '13px "Trebuchet MS", sans-serif';
  CONTROLS_TEXT.forEach((t, i) => ctx.fillText(t, 410, 606 + i * 18));
  ctx.fillStyle = '#ffc93c';
  ctx.font = '12px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('An original game — our own city, story and characters. No Rockstar content.', 640, 712);
  ctx.textAlign = 'left';
}

function drawMenuButtons(ctx, G) {
  const buttons = G.titleButtons;
  ctx.textAlign = 'center';
  for (const b of buttons) {
    const hover = G.mouse.x >= b.x && G.mouse.x <= b.x + b.w && G.mouse.y >= b.y && G.mouse.y <= b.y + b.h;
    ctx.fillStyle = hover ? '#ffc93c' : 'rgba(20,12,6,0.85)';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = '#ffc93c';
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = hover ? '#241407' : '#ffe9c4';
    ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
    ctx.fillText(b.label, b.x + b.w / 2, b.y + 33);
  }
  ctx.textAlign = 'left';
}

export function drawPause(ctx, G) {
  dim(ctx);
  ctx.fillStyle = '#ffe9c4';
  ctx.font = 'bold 48px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', 640, 200);
  ctx.font = '16px "Trebuchet MS", sans-serif';
  ctx.fillText('Progress auto-saves after every mission. Press P or Esc to resume.', 640, 240);
  ctx.textAlign = 'left';
  drawMenuButtons(ctx, G);
}

export function drawEndScreen(ctx, G, kind) {
  dim(ctx);
  ctx.textAlign = 'center';
  if (kind === 'busted') {
    ctx.fillStyle = '#3a6ea5';
    ctx.font = 'bold 64px "Trebuchet MS", sans-serif';
    ctx.fillText('BUSTED!', 640, 260);
    ctx.fillStyle = '#ffe9c4';
    ctx.font = '18px "Trebuchet MS", sans-serif';
    ctx.fillText('Sheriff Boone hauled you in. Fine: $' + (G.bustedFine || 0) + '.', 640, 310);
    ctx.fillText('You are back on the street — the debt is still waiting.', 640, 340);
  } else if (kind === 'wasted') {
    ctx.fillStyle = '#c94f4f';
    ctx.font = 'bold 64px "Trebuchet MS", sans-serif';
    ctx.fillText('WASTED', 640, 260);
    ctx.fillStyle = '#ffe9c4';
    ctx.font = '18px "Trebuchet MS", sans-serif';
    ctx.fillText('The Copper Clinic patched you up. You lost $100.', 640, 310);
  } else {
    ctx.fillStyle = '#ffc93c';
    ctx.font = 'bold 64px "Trebuchet MS", sans-serif';
    ctx.fillText('DEBT FREE!', 640, 240);
    ctx.fillStyle = '#ffe9c4';
    ctx.font = '20px "Trebuchet MS", sans-serif';
    ctx.fillText('Rook Calloway delivered the last load. Vera Voss is paid.', 640, 300);
    ctx.fillText('Copperhead County is yours now — keep driving, keep collecting.', 640, 330);
    ctx.font = '16px "Trebuchet MS", sans-serif';
    ctx.fillText('Missions: ' + G.stats.missionsDone + '/6   •   Cars stolen: ' + G.stats.carsStolen + '   •   Nuggets: ' + G.stats.nuggets + '/' + G.nuggetTotal, 640, 380);
  }
  ctx.font = '16px "Trebuchet MS", sans-serif';
  ctx.fillText('Press ENTER to continue', 640, 440);
  ctx.textAlign = 'left';
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(15,8,4,0.72)';
  ctx.fillRect(0, 0, 1280, 720);
}

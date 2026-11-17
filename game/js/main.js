// Copperhead County — entry point. Boots the world, runs the loop,
// wires menus, save/load, the day cycle and the dust storms.
import { WORLD, VIEW, DEBT_TOTAL } from './config.js';
import { mulberry32, clamp } from './rng.js';
import { buildWorld } from './world.js';
import { AudioEngine } from './audio.js';
import { Input } from './input.js';
import { makePlayer, updatePlayer } from './player.js';
import { spawnTraffic, updateTraffic, updateDriving, tryEnterCar } from './vehicles.js';
import { spawnPedestrians, updatePedestrians } from './pedestrians.js';
import { updatePolice } from './police.js';
import { updateCombat } from './combat.js';
import { spawnNuggets, updateCollectibles } from './collectibles.js';
import { makeMissionSystem } from './missions.js';
import { drawWorld } from './render.js';
import { drawHUD, drawTitle, drawPause, drawEndScreen } from './hud.js';
import { saveGame, loadSave, hasSave, applySave } from './save.js';
import { shotName, applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const G = {
  mode: 'title',
  time: 0,
  dayTime: 0.32,
  world: null,
  player: null,
  cars: [], peds: [], police: [], roadblocks: [],
  bullets: [], particles: [],
  nuggets: [], nuggetTotal: 0,
  mission: null,
  wanted: 0, wantedTimer: 0,
  spawnCooldown: 0, roadblockTimer: 8,
  storm: { active: false, timer: 75, t: 0, particles: [] },
  messages: [],
  camera: { x: 1600, y: 1200 },
  fireCooldown: 0,
  stats: { missionsDone: 0, missionsFailed: 0, carsStolen: 0, pedsDown: 0, nuggets: 0, deaths: 0, busted: 0 },
  bustedFine: 0,
  shot: null,
  titleButtons: [],
  mouse: { x: 0, y: 0 },
  pedRng: null,
  audio: new AudioEngine(),
  input: null,
  savedMissions: 0,
};

G.addMessage = function (text) {
  G.messages.push({ text, t: 0 });
  if (G.messages.length > 5) G.messages.shift();
};

G.spawnParticles = function (x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 40 + Math.random() * 140;
    G.particles.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: 0.5, max: 0.5, size: 2 + Math.random() * 3, color,
    });
  }
};

function newGame(G, seed) {
  G.world = buildWorld(seed);
  G.pedRng = mulberry32(seed + 55);
  G.player = makePlayer(820, 900);
  G.player.debt = DEBT_TOTAL;
  G.cars = []; G.peds = []; G.police = []; G.roadblocks = [];
  G.bullets = []; G.particles = [];
  G.wanted = 0; G.wantedTimer = 0;
  G.storm = { active: false, timer: 75, t: 0, particles: [] };
  G.messages = [];
  G.stats = { missionsDone: 0, missionsFailed: 0, carsStolen: 0, pedsDown: 0, nuggets: 0, deaths: 0, busted: 0 };
  G.savedMissions = 0;
  spawnTraffic(G);
  spawnPedestrians(G);
  spawnNuggets(G);
  G.mission = makeMissionSystem(G);
  G.camera.x = G.player.x;
  G.camera.y = G.player.y;
}

function startPlay(G, fromSave) {
  if (fromSave) {
    const d = loadSave();
    if (d) applySave(G, d);
  }
  G.mode = 'play';
  G.mission.start(G);
  G.addMessage('Mission 1: ' + G.mission.current().name + ' — talk to Duke (E)');
  G.audio.ensure();
}

function refreshTitleButtons(G) {
  const buttons = [
    { id: 'new', label: 'NEW GAME', x: 490, y: 400, w: 300, h: 52 },
  ];
  if (hasSave()) buttons.push({ id: 'continue', label: 'CONTINUE', x: 490, y: 462, w: 300, h: 52 });
  G.titleButtons = buttons;
}

function refreshPauseButtons(G) {
  G.titleButtons = [
    { id: 'resume', label: 'RESUME', x: 490, y: 300, w: 300, h: 52 },
    { id: 'save', label: 'SAVE GAME', x: 490, y: 362, w: 300, h: 52 },
    { id: 'quit', label: 'QUIT TO TITLE', x: 490, y: 424, w: 300, h: 52 },
  ];
}

function clickButton(G) {
  const m = G.input.mouse;
  for (const b of G.titleButtons) {
    if (m.x >= b.x && m.x <= b.x + b.w && m.y >= b.y && m.y <= b.y + b.h) {
      G.audio.ensure();
      G.audio.click();
      if (b.id === 'new') { newGame(G, 20261117); startPlay(G, false); }
      else if (b.id === 'continue') { newGame(G, 20261117); startPlay(G, true); }
      else if (b.id === 'resume') { G.mode = 'play'; }
      else if (b.id === 'save') { saveGame(G); G.addMessage('Game saved.'); G.mode = 'play'; }
      else if (b.id === 'quit') { G.mode = 'title'; refreshTitleButtons(G); }
      return true;
    }
  }
  return false;
}

function updateStorm(G, dt) {
  const s = G.storm;
  if (!G.shot) {
    if (!s.active) {
      s.timer -= dt;
      if (s.timer <= 0) {
        s.active = true; s.t = 16;
        s.particles = [];
        for (let i = 0; i < 70; i++) {
          s.particles.push({ x: Math.random() * 1280, y: Math.random() * 720, r: 2 + Math.random() * 5, a: Math.random() });
        }
        G.addMessage('A dust storm is rolling in!');
      }
    } else {
      s.t -= dt;
      for (const d of s.particles) {
        d.x -= (160 + d.r * 30) * dt;
        d.y += 30 * dt;
        if (d.x < -10) { d.x = 1290; d.y = Math.random() * 720; }
        if (d.y > 730) d.y = -10;
      }
      if (s.t <= 0) { s.active = false; s.timer = 70 + Math.random() * 60; }
    }
  }
}

function updatePlay(G, dt) {
  const input = G.input;
  const p = G.player;
  // Screenshot staging: freeze the staged scene exactly as composed.
  if (G.shot) {
    G.camera.x = clamp(p.x, VIEW.w / 2, WORLD.w - VIEW.w / 2);
    G.camera.y = clamp(p.y, VIEW.h / 2, WORLD.h - VIEW.h / 2);
    return;
  }
  G.time += dt;
  if (!G.shot) G.dayTime = (G.dayTime + dt / 420) % 1;
  updateStorm(G, dt);

  // Pause.
  if (input.pressed('KeyP', 'Escape')) {
    G.mode = 'pause';
    refreshPauseButtons(G);
    return;
  }
  // Radio + mute.
  if (input.pressed('KeyR')) {
    G.audio.station = (G.audio.station + 1) % 3;
    G.audio.noteStep = 0;
    G.addMessage('Radio: ' + ['KCOY 88.1 — Desert Country', 'DUST ROCK 104.7', 'NEON MIRAGE 99.9'][G.audio.station]);
  }
  if (input.pressed('KeyM')) {
    const muted = G.audio.toggleMute();
    G.addMessage(muted ? 'Sound muted' : 'Sound on');
  }
  // Interact: dialogue first, then cars.
  if (input.pressed('KeyE')) {
    if (G.mission.dialogue) {
      G.mission.advanceDialogue(G);
    } else {
      const res = tryEnterCar(G);
      if (res === 'steal') {
        G.addMessage('You stole the ' + (p.car ? p.car.type : 'car') + ' — the sheriff noticed!');
        G.mission.onSteal(G, p.car);
      } else if (res === 'exit') {
        G.addMessage('You left the car.');
      } else if (res === 'moving') {
        G.addMessage('Too fast to jump in!');
      }
    }
  }

  if (p.onFoot) updatePlayer(G, dt, input);
  else updateDriving(G, dt, input);
  updateTraffic(G, dt);
  updatePedestrians(G, dt);
  updatePolice(G, dt);
  updateCombat(G, dt, input);
  updateCollectibles(G, dt);
  G.mission.update(G, dt);

  // Bullets + particles.
  for (const pt of G.particles) {
    pt.x += pt.vx * dt; pt.y += pt.vy * dt;
    pt.vx *= 0.92; pt.vy *= 0.92;
    pt.life -= dt;
  }
  G.particles = G.particles.filter(pt => pt.life > 0);
  for (const m of G.messages) m.t += dt;
  G.messages = G.messages.filter(m => m.t < 6);

  // Camera follows the player.
  G.camera.x = clamp(p.x, VIEW.w / 2, WORLD.w - VIEW.w / 2);
  G.camera.y = clamp(p.y, VIEW.h / 2, WORLD.h - VIEW.h / 2);

  // Auto-save after a mission completes.
  if (G.stats.missionsDone !== G.savedMissions) {
    G.savedMissions = G.stats.missionsDone;
    saveGame(G);
  }
  G.audio.update(dt, G.wanted);
}

function updateTitle(G, dt) {
  if (G.input.mouse.clicked) clickButton(G);
  if (G.input.pressed('Enter')) {
    G.audio.ensure();
    newGame(G, 20261117);
    startPlay(G, hasSave());
  }
}

function updatePause(G) {
  if (G.input.mouse.clicked) clickButton(G);
  if (G.input.pressed('KeyP', 'Escape', 'Enter')) G.mode = 'play';
}

function updateEnd(G) {
  if (G.input.pressed('Enter')) {
    const p = G.player;
    if (G.mode === 'wasted') {
      p.cash = Math.max(0, p.cash - 100);
      p.hp = 100;
      p.x = 2420; p.y = 1240;
      p.onFoot = true; p.car = null;
    }
    G.mode = 'play';
  }
}

function frame(t) {
  requestAnimationFrame(frame);
  const now = t / 1000;
  let dt = now - (frame.last || now);
  frame.last = now;
  dt = Math.min(dt, 0.05);
  if (dt <= 0) dt = 1 / 60;
  const input = G.input;
  G.mouse.x = input.mouse.x;
  G.mouse.y = input.mouse.y;

  if (G.mode === 'title') updateTitle(G, dt);
  else if (G.mode === 'pause') updatePause(G);
  else if (G.mode === 'busted' || G.mode === 'wasted' || G.mode === 'win') updateEnd(G);
  else if (G.mode === 'play') updatePlay(G, dt);

  // Render.
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);
  if (G.mode === 'title') {
    drawTitle(ctx, G);
  } else {
    drawWorld(ctx, G);
    if (G.mode === 'play') drawHUD(ctx, G);
    if (G.mode === 'pause') drawPause(ctx, G);
    if (G.mode === 'busted') drawEndScreen(ctx, G, 'busted');
    if (G.mode === 'wasted') drawEndScreen(ctx, G, 'wasted');
    if (G.mode === 'win') drawEndScreen(ctx, G, 'win');
  }
  input.endFrame();
}

function boot() {
  G.input = new Input(canvas);
  newGame(G, 20261117);
  refreshTitleButtons(G);
  const shot = shotName();
  if (shot) {
    applyShot(G, shot);
    if (shot === 'start') refreshTitleButtons(G);
  }
  // Warm the audio engine on the first user gesture.
  window.addEventListener('pointerdown', () => G.audio.ensure(), { once: true });
  window.addEventListener('keydown', () => G.audio.ensure(), { once: true });
  requestAnimationFrame(frame);
}

boot();

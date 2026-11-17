'use strict';
// Copperhead County — boot, game loop, state machine and screenshot staging.
// A 2D top-down open-world crime game: a desert town, a highway and a casino
// strip, built from original code, art and sound. No Rockstar material.
window.addEventListener('error', function (e) {
  var el = document.getElementById('errlog');
  if (el) el.textContent = 'ERR:' + (e.message || 'unknown');
});

CH.G = {
  canvas: null, ctx: null,
  cam: { x: 0, y: 0 },
  time: 0, timeOfDay: 10,
  state: 'menu',
  player: null,
  wanted: 0,
  money: 0,
  nuggets: 0,
  missionsDone: [],
  gunshotT: 0,
  shotMode: null,
  frozen: false,
  lastTs: 0,
  autosaveT: 0
};

CH.update = function (dt) {
  var G = CH.G;
  G.time += dt;
  G.timeOfDay = (G.timeOfDay + dt * 0.05) % 24;
  CH.input.mouseWorldX = G.cam.x + CH.input.mouseX;
  CH.input.mouseWorldY = G.cam.y + CH.input.mouseY;
  CH.updatePlayer(dt);
  CH.updateVehicles(dt);
  CH.updatePeds(dt);
  CH.updatePolice(dt);
  CH.updateMission(dt);
  CH.updateParticles(dt);
  CH.updateDustStorm(dt);
  CH.updateCamera(dt);
  CH.Audio.radioTick(dt);
  G.autosaveT += dt;
  if (G.autosaveT > 15) { G.autosaveT = 0; CH.saveGame(); }
};

CH.loop = function (ts) {
  requestAnimationFrame(CH.loop);
  var G = CH.G;
  var dt = 1 / 60;
  if (G.lastTs) dt = Math.min(0.05, (ts - G.lastTs) / 1000);
  G.lastTs = ts;
  if (G.state === 'playing' && !G.frozen) CH.update(dt);
  else if (G.state === 'menu') { G.time += dt; CH.updateCamera(dt); }
  CH.render();
  CH.updateHUD();
};

CH.newGame = function () {
  var G = CH.G;
  CH.clearSave();
  G.money = 0; G.nuggets = 0; G.missionsDone = [];
  G.wanted = 0; G.timeOfDay = 10;
  CH.COLLECTIBLES.forEach(function (c) { c.taken = false; });
  CH.PICKUPS.forEach(function (p) { p.taken = false; });
  CH.initPlayer(705, 300);
  G.player.money = 0;
  CH.spawnTraffic();
  CH.spawnPeds();
  CH.policeCars = []; CH.roadblocks = [];
  G.state = 'playing';
  CH.hideDialog();
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('endScreen').style.display = 'none';
  document.getElementById('pauseScreen').style.display = 'none';
  CH.showMsg('Selamat datang di Copperhead County. Misi 1: First Gear.');
  setTimeout(function () { CH.startMission(0); }, 600);
};

CH.continueGame = function () {
  var data = CH.loadGame();
  if (!data) { CH.newGame(); return; }
  var G = CH.G;
  CH.initPlayer(705, 300);
  CH.spawnTraffic();
  CH.spawnPeds();
  CH.policeCars = []; CH.roadblocks = [];
  CH.applySave(data);
  G.state = 'playing';
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('endScreen').style.display = 'none';
  CH.showMsg('Lanjutan dimuat. Misi berikutnya: ' + CH.MISSIONS[G.missionsDone.length].name);
  setTimeout(function () { CH.startMission(G.missionsDone.length); }, 600);
};

CH.backToMenu = function () {
  var G = CH.G;
  CH.saveGame();
  G.state = 'menu';
  document.getElementById('endScreen').style.display = 'none';
  document.getElementById('pauseScreen').style.display = 'none';
  document.getElementById('startScreen').style.display = 'flex';
  CH.hideDialog();
  CH.Audio.setSiren(false);
  CH.Audio.setEngine(0, false);
  var cb = document.getElementById('continueBtn');
  if (cb) cb.style.display = CH.hasSave() ? 'inline-block' : 'none';
};

// Move pedestrians out of a driving corridor so a staged shot stays clean.
CH.clearCorridor = function (x1, y1, x2, y2) {
  var minX = Math.min(x1, x2) - 120, maxX = Math.max(x1, x2) + 120;
  var minY = Math.min(y1, y2) - 120, maxY = Math.max(y1, y2) + 120;
  for (var i = 0; i < CH.peds.length; i++) {
    var p = CH.peds[i];
    if (p.x > minX && p.x < maxX && p.y > minY && p.y < maxY) {
      var np = CH.randomRoadPoint();
      p.x = np.x; p.y = np.y; p.tx = np.x; p.ty = np.y;
    }
  }
};

// Deterministic staging for the four screenshots (?shot=start|play|chase|mission).
CH.setupShot = function (mode) {
  var G = CH.G;
  G.shotMode = mode;
  G.state = 'playing';
  document.getElementById('startScreen').style.display = 'none';
  if (mode === 'start') {
    G.state = 'menu';
    G.timeOfDay = 10;
    G.cam.x = 400; G.cam.y = 500;
    document.getElementById('startScreen').style.display = 'flex';
    return;
  }
  if (mode === 'play') {
    G.timeOfDay = 11;
    // Cruise the empty north scenic road: no parked cars, no traffic loop.
    var car = CH.makeVehicle('sedan', 700, 165, 0, { driver: 'player', color: '#c94f3d' });
    G.player.vehicle = car; G.player.onFoot = false;
    G.player.x = car.x; G.player.y = car.y;
    car.speed = 260;
    CH.clearCorridor(650, 165, 1500, 165);
    G.cam.x = 60; G.cam.y = 0;
  } else if (mode === 'chase') {
    G.timeOfDay = 16.5;
    var truck = CH.makeVehicle('pickup', 1800, 2145, 0, { driver: 'player', color: '#3d7ac9' });
    G.player.vehicle = truck; G.player.onFoot = false;
    G.player.x = truck.x; G.player.y = truck.y;
    truck.speed = 430;
    G.wanted = 3;
    CH.roadblockCooldown = 999;
    for (var i = 0; i < 3; i++) {
      var pc = CH.makeVehicle('police', 1800 - 260 - i * 110, 2145 + (i % 2 === 0 ? 26 : -26), 0, { driver: 'police', ai: 'chase' });
      pc.speed = 400;
      CH.policeCars.push(pc);
    }
    // Roadblock far ahead on the highway, visible at the right edge.
    var keepX = G.player.x;
    G.player.x = 2630;
    CH.spawnRoadblock();
    G.player.x = keepX;
    CH.clearCorridor(1600, 2145, 3200, 2145);
    G.cam.x = 1160; G.cam.y = 1745;
    CH.showMsg('Sheriff mengejarmu! Wanted 3 bintang.');
  } else if (mode === 'mission') {
    G.timeOfDay = 9;
    // Drive east on the strip road between the two casino rows, marker in view.
    var sedan = CH.makeVehicle('sedan', 2500, 1915, 0, { driver: 'player', color: '#5da85d' });
    G.player.vehicle = sedan; G.player.onFoot = false;
    G.player.x = sedan.x; G.player.y = sedan.y;
    sedan.speed = 300;
    CH.clearCorridor(2400, 1915, 3200, 1915);
    G.cam.x = 1860; G.cam.y = 1515;
    CH.startMission(1);
    CH.mission.step = 1; // package already picked up: delivering to Desert Rose
    CH.hideDialog();
  }
  // Hold the gas through a fixed number of steps so the frame is identical
  // every capture, then freeze the simulation for the screenshot.
  CH.input.up = true;
  var steps = mode === 'chase' ? 70 : mode === 'mission' ? 45 : 100;
  for (var s = 0; s < steps; s++) CH.update(1 / 60);
  CH.input.up = false;
  G.frozen = true;
};

CH.fitCanvas = function () {
  var cv = document.getElementById('game');
  var scale = Math.min(window.innerWidth / 1280, window.innerHeight / 800);
  cv.style.width = Math.floor(1280 * scale) + 'px';
  cv.style.height = Math.floor(800 * scale) + 'px';
};

CH.init = function () {
  var G = CH.G;
  G.canvas = document.getElementById('game');
  G.ctx = G.canvas.getContext('2d');
  CH.buildWorld();
  CH.initPlayer(705, 300);
  CH.spawnTraffic();
  CH.spawnPeds();
  CH.initInput();
  CH.fitCanvas();
  window.addEventListener('resize', CH.fitCanvas);
  document.getElementById('newGameBtn').addEventListener('click', function () {
    CH.Audio.init(); CH.Audio.resume(); CH.newGame();
  });
  document.getElementById('continueBtn').addEventListener('click', function () {
    CH.Audio.init(); CH.Audio.resume(); CH.continueGame();
  });
  document.getElementById('resumeBtn').addEventListener('click', function () { CH.togglePause(); });
  document.getElementById('quitBtn').addEventListener('click', function () { CH.backToMenu(); });
  document.getElementById('endBtn').addEventListener('click', function () { CH.backToMenu(); });
  document.getElementById('dialog').addEventListener('click', function () { CH.advanceDialog(); });
  var cb = document.getElementById('continueBtn');
  if (cb) cb.style.display = CH.hasSave() ? 'inline-block' : 'none';
  var params = new URLSearchParams(window.location.search);
  var shot = params.get('shot');
  if (shot) CH.setupShot(shot);
  requestAnimationFrame(CH.loop);
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', CH.init);
else CH.init();

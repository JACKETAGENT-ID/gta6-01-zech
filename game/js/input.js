'use strict';
// Keyboard + mouse input. WASD/arrows drive and walk, E enters cars,
// Space punches, click shoots, R changes radio, P pauses, M mutes.
CH.input = {
  up: false, down: false, left: false, right: false,
  mouseX: 0, mouseY: 0, mouseWorldX: 0, mouseWorldY: 0,
  mouseDown: false, punch: false
};

CH.initInput = function () {
  var cv = document.getElementById('game');
  var keys = {};
  var GAME_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
  window.addEventListener('keydown', function (e) {
    if (GAME_KEYS.indexOf(e.key) >= 0) e.preventDefault();
    if (e.repeat) return;
    keys[e.key.toLowerCase()] = true;
    CH.syncKeys(keys);
    if (e.key === 'e' || e.key === 'E') CH.tryEnterExit();
    if (e.key === 'Enter') CH.advanceDialog();
    if (e.key === ' ') CH.input.punch = true;
    if (e.key === 'r' || e.key === 'R') {
      var st = CH.Audio.nextStation();
      CH.showMsg('Radio: ' + st);
    }
    if (e.key === 'm' || e.key === 'M') {
      CH.showMsg(CH.Audio.toggleMute() ? 'Suara dimatikan' : 'Suara dinyalakan');
    }
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') CH.togglePause();
  });
  window.addEventListener('keyup', function (e) {
    keys[e.key.toLowerCase()] = false;
    CH.syncKeys(keys);
    if (e.key === ' ') CH.input.punch = false;
  });
  window.addEventListener('blur', function () {
    keys = {}; CH.syncKeys(keys); CH.input.mouseDown = false; CH.input.punch = false;
  });
  cv.addEventListener('mousemove', function (e) {
    var rect = cv.getBoundingClientRect();
    CH.input.mouseX = (e.clientX - rect.left) * (1280 / rect.width);
    CH.input.mouseY = (e.clientY - rect.top) * (800 / rect.height);
  });
  cv.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    CH.input.mouseDown = true;
    CH.Audio.init(); CH.Audio.resume();
    var rect = cv.getBoundingClientRect();
    CH.input.mouseX = (e.clientX - rect.left) * (1280 / rect.width);
    CH.input.mouseY = (e.clientY - rect.top) * (800 / rect.height);
  });
  window.addEventListener('mouseup', function () { CH.input.mouseDown = false; });
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
};

CH.syncKeys = function (keys) {
  var inp = CH.input;
  inp.up = !!(keys['w'] || keys['arrowup']);
  inp.down = !!(keys['s'] || keys['arrowdown']);
  inp.left = !!(keys['a'] || keys['arrowleft']);
  inp.right = !!(keys['d'] || keys['arrowright']);
};

CH.togglePause = function () {
  var G = CH.G;
  if (G.state === 'playing') {
    G.state = 'paused';
    var el = document.getElementById('pauseScreen');
    if (el) el.style.display = 'flex';
  } else if (G.state === 'paused') {
    G.state = 'playing';
    var el2 = document.getElementById('pauseScreen');
    if (el2) el2.style.display = 'none';
  }
};

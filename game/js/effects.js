'use strict';
// Particles, day-night cycle, dust storms and screen shake.
CH.particles = [];
CH.shakeMag = 0;
CH.dustStorm = { active: false, t: 0, next: 70 };

CH.shake = function (mag) { CH.shakeMag = Math.max(CH.shakeMag, mag); };

CH.spawnBurst = function (x, y, n, color) {
  for (var i = 0; i < n; i++) {
    var a = CH.rand(0, Math.PI * 2), s = CH.rand(40, 220);
    CH.particles.push({
      x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: CH.rand(0.3, 0.8), maxLife: 0.8, size: CH.rand(2, 6), color: color, kind: 'dot'
    });
  }
};

CH.spawnDust = function (x, y) {
  CH.particles.push({
    x: x, y: y, vx: CH.rand(-20, 20), vy: CH.rand(-30, -5),
    life: CH.rand(0.4, 0.9), maxLife: 0.9, size: CH.rand(4, 9), color: '#c9a06a', kind: 'dust'
  });
};

CH.updateParticles = function (dt) {
  for (var i = CH.particles.length - 1; i >= 0; i--) {
    var p = CH.particles[i];
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= (1 - 2 * dt); p.vy *= (1 - 2 * dt);
    p.life -= dt;
    if (p.life <= 0) CH.particles.splice(i, 1);
  }
  if (CH.particles.length > 600) CH.particles.splice(0, CH.particles.length - 600);
};

CH.drawParticles = function (c) {
  for (var i = 0; i < CH.particles.length; i++) {
    var p = CH.particles[i];
    c.globalAlpha = CH.clamp(p.life / p.maxLife, 0, 1) * (p.kind === 'dust' ? 0.5 : 0.9);
    c.fillStyle = p.color;
    c.beginPath(); c.arc(p.x, p.y, p.size, 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;
};

// Day cycle: 24 game-hours per 8 real minutes. Returns the light overlay.
CH.dayOverlay = function () {
  var h = CH.G.timeOfDay;
  var sun = Math.sin((h - 6) / 12 * Math.PI); // 1 at noon, -1 at midnight
  if (sun > 0.55) return null; // bright midday
  if (sun > 0) return { color: '255,140,60', alpha: (0.55 - sun) * 0.28 }; // golden hour
  if (sun > -0.4) return { color: '40,40,90', alpha: 0.22 + (-sun) * 0.35 }; // dusk
  return { color: '8,10,40', alpha: 0.42 }; // night
};

CH.updateDustStorm = function (dt) {
  var d = CH.dustStorm;
  if (CH.G.shotMode) return; // screenshots stay clear
  if (!d.active) {
    d.next -= dt;
    if (d.next <= 0) {
      d.active = true; d.t = 18;
      CH.showMsg('BADAI DEBU datang dari gurun! Pandangan terbatas.');
    }
  } else {
    d.t -= dt;
    var G = CH.G;
    for (var i = 0; i < 3; i++) {
      CH.particles.push({
        x: G.cam.x + CH.rand(0, 1280), y: G.cam.y + CH.rand(0, 800),
        vx: CH.rand(200, 420), vy: CH.rand(-30, 30),
        life: CH.rand(0.5, 1.1), maxLife: 1.1, size: CH.rand(3, 8), color: '#d9a05f', kind: 'dust'
      });
    }
    if (d.t <= 0) { d.active = false; d.next = CH.rand(70, 130); }
  }
};

CH.drawDustOverlay = function (c, vw, vh) {
  if (!CH.dustStorm.active) return;
  c.fillStyle = 'rgba(217,160,95,0.18)';
  c.fillRect(0, 0, vw, vh);
};

CH.updateCamera = function (dt) {
  var G = CH.G;
  var tx = CH.clamp(G.player.x - 640, 0, CH.WORLD_W - 1280);
  var ty = CH.clamp(G.player.y - 400, 0, CH.WORLD_H - 800);
  G.cam.x += (tx - G.cam.x) * Math.min(1, dt * 5);
  G.cam.y += (ty - G.cam.y) * Math.min(1, dt * 5);
  CH.shakeMag = Math.max(0, CH.shakeMag - dt * 30);
};

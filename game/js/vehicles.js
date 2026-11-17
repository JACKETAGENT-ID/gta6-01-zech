'use strict';
// Vehicles: five civilian types plus police. Arcade top-down physics, traffic AI,
// parked cars, stealing. Every vehicle is drawn from code, no images.
CH.VEHICLE_TYPES = {
  sedan:      { len: 46, wid: 22, maxSpeed: 520, accel: 430, turn: 2.4, color: '#c94f3d', health: 100 },
  pickup:     { len: 52, wid: 24, maxSpeed: 480, accel: 400, turn: 2.2, color: '#3d7ac9', health: 120 },
  motorcycle: { len: 34, wid: 12, maxSpeed: 640, accel: 560, turn: 3.1, color: '#e8a13c', health: 60 },
  bus:        { len: 78, wid: 28, maxSpeed: 340, accel: 260, turn: 1.7, color: '#e8d44d', health: 200 },
  van:        { len: 58, wid: 26, maxSpeed: 430, accel: 350, turn: 2.0, color: '#8a8f96', health: 150 },
  police:     { len: 48, wid: 23, maxSpeed: 570, accel: 500, turn: 2.6, color: '#f2f2f2', health: 140 }
};
CH.CAR_COLORS = ['#c94f3d', '#3d7ac9', '#e8a13c', '#5da85d', '#8a5fc9', '#c9c9c9', '#4d4d55', '#d97ba8', '#3fa8a0'];
CH.vehicles = [];
CH.vehicleSeq = 0;

CH.makeVehicle = function (type, x, y, angle, opts) {
  opts = opts || {};
  var t = CH.VEHICLE_TYPES[type];
  var v = {
    id: ++CH.vehicleSeq, type: type, x: x, y: y, angle: angle || 0,
    speed: 0, health: t.health, maxHealth: t.health,
    len: t.len, wid: t.wid, maxSpeed: t.maxSpeed, accel: t.accel, turn: t.turn,
    color: opts.color || (type === 'police' ? '#f2f2f2' : CH.pick(CH.CAR_COLORS)),
    driver: opts.driver || 'parked', loop: opts.loop || 0, wp: opts.wp || 0,
    lane: opts.lane || (CH.rng() > 0.5 ? 18 : -18), cruise: CH.rand(170, 250),
    ai: opts.ai || null, dead: false, smoke: 0
  };
  CH.vehicles.push(v);
  return v;
};

CH.spawnTraffic = function () {
  CH.vehicles = [];
  for (var i = 0; i < 14; i++) {
    var loop = CH.TRAFFIC_LOOPS[i % CH.TRAFFIC_LOOPS.length];
    var wp = Math.floor(i / CH.TRAFFIC_LOOPS.length) % loop.length;
    var p = loop[wp];
    var q = loop[(wp + 1) % loop.length];
    var a = Math.atan2(q[1] - p[1], q[0] - p[0]);
    var types = ['sedan', 'sedan', 'pickup', 'van', 'bus', 'motorcycle'];
    var v = CH.makeVehicle(CH.pick(types), p[0] + CH.rand(-30, 30), p[1] + CH.rand(-30, 30), a,
      { driver: 'traffic', loop: i % CH.TRAFFIC_LOOPS.length, wp: wp });
    v.speed = v.cruise;
  }
  // Parked cars along town streets.
  var spots = [[530, 470], [930, 830], [1330, 470], [1730, 1230], [930, 1230], [1330, 1630], [530, 1230], [1730, 830]];
  for (var s = 0; s < spots.length; s++) {
    CH.makeVehicle(CH.pick(['sedan', 'pickup', 'van']), spots[s][0], spots[s][1], (s % 2 === 0) ? 0 : Math.PI / 2, { driver: 'parked' });
  }
  // The getaway van for the final mission waits at the junkyard.
  CH.makeVehicle('van', 300, 1930, 0, { driver: 'parked', color: '#5a3d7a' });
};

CH.nearestVehicle = function (x, y, maxD, exclude) {
  var best = null, bd = maxD;
  for (var i = 0; i < CH.vehicles.length; i++) {
    var v = CH.vehicles[i];
    if (v.dead || v === exclude) continue;
    var d = CH.dist(x, y, v.x, v.y);
    if (d < bd) { bd = d; best = v; }
  }
  return best;
};

CH.drivePhysics = function (v, throttle, steer, dt) {
  var onRoad = CH.pointOnRoad(v.x, v.y, 0);
  var cap = v.maxSpeed * (onRoad ? 1 : 0.55);
  if (throttle > 0) v.speed += v.accel * throttle * dt;
  else if (throttle < 0) v.speed += v.accel * 0.7 * throttle * dt;
  else v.speed -= Math.sign(v.speed) * Math.min(Math.abs(v.speed), 240 * dt);
  if (v.speed > cap) v.speed = cap;
  if (v.speed < -v.maxSpeed * 0.4) v.speed = -v.maxSpeed * 0.4;
  var turnRate = v.turn * CH.clamp(v.speed / 220, -1, 1);
  v.angle += steer * turnRate * dt;
  var nx = v.x + Math.cos(v.angle) * v.speed * dt;
  var ny = v.y + Math.sin(v.angle) * v.speed * dt;
  var hit = CH.collidesBuilding(nx, ny, v.len / 2 - 4);
  if (hit) {
    if (Math.abs(v.speed) > 260 && v.driver === 'player') {
      v.health -= Math.abs(v.speed) * 0.06;
      CH.Audio.sfx('crash'); CH.shake(6);
      CH.spawnBurst(v.x, v.y, 10, '#888888');
    }
    v.speed *= 0.35;
  } else { v.x = nx; v.y = ny; }
  v.x = CH.clamp(v.x, 30, CH.WORLD_W - 30);
  v.y = CH.clamp(v.y, 30, CH.WORLD_H - 30);
  if (v.health < 40) v.smoke += dt;
  if (v.health <= 0 && !v.dead) CH.explodeVehicle(v);
};

CH.explodeVehicle = function (v) {
  v.dead = true;
  CH.spawnBurst(v.x, v.y, 40, '#ff7a2a');
  CH.spawnBurst(v.x, v.y, 24, '#555555');
  CH.Audio.sfx('crash'); CH.shake(14);
  var G = CH.G;
  if (G.player.vehicle === v) {
    G.player.vehicle = null; G.player.onFoot = true;
    G.player.x = v.x + 40; G.player.y = v.y;
    G.player.health -= 25;
  }
};

CH.updateTraffic = function (v, dt) {
  var loop = CH.TRAFFIC_LOOPS[v.loop];
  var tgt = loop[v.wp];
  var dx = tgt[0] - v.x, dy = tgt[1] - v.y;
  var d = Math.hypot(dx, dy);
  if (d < 70) { v.wp = (v.wp + 1) % loop.length; return; }
  var want = Math.atan2(dy, dx);
  var steer = CH.clamp(CH.angDiff(v.angle, want) * 1.6, -1, 1);
  var throttle = 1;
  // Slow down for a vehicle ahead.
  for (var i = 0; i < CH.vehicles.length; i++) {
    var o = CH.vehicles[i];
    if (o === v || o.dead) continue;
    var od = CH.dist(v.x, v.y, o.x, o.y);
    if (od < 70) {
      var oa = Math.atan2(o.y - v.y, o.x - v.x);
      if (Math.abs(CH.angDiff(v.angle, oa)) < 0.7) { throttle = 0; break; }
    }
  }
  // Pedestrians in the way: stop.
  for (var p = 0; p < CH.peds.length; p++) {
    var pd = CH.peds[p];
    if (pd.state === 'down') continue;
    if (CH.dist(v.x, v.y, pd.x, pd.y) < 46) { throttle = 0; break; }
  }
  CH.drivePhysics(v, throttle, steer, dt);
  // Keep traffic on the road: nudge back toward the loop if it drifted off.
  if (!CH.pointOnRoad(v.x, v.y, 10)) {
    v.angle += CH.angDiff(v.angle, want) * dt * 2;
  }
};

CH.updateVehicles = function (dt) {
  var G = CH.G;
  for (var i = 0; i < CH.vehicles.length; i++) {
    var v = CH.vehicles[i];
    if (v.dead) continue;
    if (v.driver === 'player') {
      var inp = CH.input;
      var throttle = (inp.up ? 1 : 0) + (inp.down ? -1 : 0);
      var steer = (inp.left ? -1 : 0) + (inp.right ? 1 : 0);
      CH.drivePhysics(v, throttle, steer, dt);
      G.player.x = v.x; G.player.y = v.y; G.player.angle = v.angle;
      if (Math.abs(v.speed) > 60 && CH.rng() < 0.3) {
        CH.spawnDust(v.x - Math.cos(v.angle) * v.len / 2, v.y - Math.sin(v.angle) * v.len / 2);
      }
    } else if (v.driver === 'traffic') {
      CH.updateTraffic(v, dt);
    }
  }
  // Car-car collisions: push apart, share the bump.
  for (var a = 0; a < CH.vehicles.length; a++) {
    for (var b = a + 1; b < CH.vehicles.length; b++) {
      var va = CH.vehicles[a], vb = CH.vehicles[b];
      if (va.dead || vb.dead) continue;
      var d = CH.dist(va.x, va.y, vb.x, vb.y);
      var min = (va.len + vb.len) / 2 - 8;
      if (d > 0.01 && d < min) {
        var push = (min - d) / 2;
        var nx = (vb.x - va.x) / d, ny = (vb.y - va.y) / d;
        va.x -= nx * push; va.y -= ny * push;
        vb.x += nx * push; vb.y += ny * push;
        var rel = Math.abs(va.speed - vb.speed);
        if (rel > 200) {
          va.health -= rel * 0.03; vb.health -= rel * 0.03;
          if (va.driver === 'player' || vb.driver === 'player') { CH.Audio.sfx('crash'); CH.shake(4); }
        }
        va.speed *= 0.85; vb.speed *= 0.85;
      }
    }
  }
  CH.vehicles = CH.vehicles.filter(function (v) { return !v.dead || v.driver === 'player'; });
};

CH.enterVehicle = function (v) {
  var G = CH.G;
  if (v.driver === 'traffic') {
    // Steal it: the driver flees on foot, the law notices.
    var d = CH.makePed(v.x + 30, v.y + 10);
    d.state = 'flee';
    CH.setWanted(Math.min(5, CH.G.wanted + 1), 'steal');
    CH.Audio.sfx('steal');
    CH.showMsg('Mobil dicuri! Wanted naik.');
  }
  v.driver = 'player';
  G.player.vehicle = v; G.player.onFoot = false;
  G.player.x = v.x; G.player.y = v.y;
  CH.Audio.setEngine(0, true);
};

CH.exitVehicle = function () {
  var G = CH.G;
  var v = G.player.vehicle;
  if (!v) return;
  v.driver = 'parked'; v.speed = 0;
  G.player.vehicle = null; G.player.onFoot = true;
  G.player.x = v.x + Math.cos(v.angle + Math.PI / 2) * 34;
  G.player.y = v.y + Math.sin(v.angle + Math.PI / 2) * 34;
};

CH.drawVehicle = function (c, v) {
  c.save();
  c.translate(v.x, v.y);
  c.rotate(v.angle);
  var L = v.len, W = v.wid;
  c.fillStyle = 'rgba(0,0,0,0.3)';
  c.fillRect(-L / 2 + 3, -W / 2 + 4, L, W);
  // wheels
  c.fillStyle = '#161616';
  var wl = L * 0.26, ww = 5;
  c.fillRect(-L / 2 + 4, -W / 2 - 2, wl, ww); c.fillRect(-L / 2 + 4, W / 2 - 3, wl, ww);
  c.fillRect(L / 2 - wl - 4, -W / 2 - 2, wl, ww); c.fillRect(L / 2 - wl - 4, W / 2 - 3, wl, ww);
  if (v.type === 'motorcycle') {
    c.fillStyle = v.color;
    c.fillRect(-L / 2, -W / 2, L, W);
    c.fillStyle = '#222';
    c.beginPath(); c.arc(-2, 0, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e8c33c';
    c.fillRect(L / 2 - 2, -3, 3, 6);
  } else {
    // body
    c.fillStyle = v.color;
    c.beginPath();
    var r = 7;
    c.moveTo(-L / 2 + r, -W / 2); c.lineTo(L / 2 - r, -W / 2); c.quadraticCurveTo(L / 2, -W / 2, L / 2, -W / 2 + r);
    c.lineTo(L / 2, W / 2 - r); c.quadraticCurveTo(L / 2, W / 2, L / 2 - r, W / 2);
    c.lineTo(-L / 2 + r, W / 2); c.quadraticCurveTo(-L / 2, W / 2, -L / 2, W / 2 - r);
    c.lineTo(-L / 2, -W / 2 + r); c.quadraticCurveTo(-L / 2, -W / 2, -L / 2 + r, -W / 2);
    c.fill();
    // windshield + roof
    c.fillStyle = 'rgba(20,30,45,0.85)';
    c.fillRect(L * 0.08, -W / 2 + 3, L * 0.2, W - 6);
    c.fillStyle = 'rgba(0,0,0,0.18)';
    c.fillRect(-L * 0.28, -W / 2 + 3, L * 0.3, W - 6);
    if (v.type === 'bus') {
      c.fillStyle = 'rgba(20,30,45,0.8)';
      for (var wnd = -3; wnd <= 3; wnd++) c.fillRect(wnd * 10 - 3, -W / 2 + 3, 6, 5);
    }
    if (v.type === 'police') {
      c.fillStyle = '#1a1a1a'; c.fillRect(-L * 0.1, -W / 2 + 2, L * 0.24, W - 4);
      var flash = (Math.floor(CH.G.time * 6) % 2 === 0);
      c.fillStyle = flash ? '#ff2a2a' : '#2a6aff';
      c.fillRect(-6, -W / 2 - 1, 12, 5);
      c.fillStyle = flash ? '#2a6aff' : '#ff2a2a';
      c.fillRect(-6, W / 2 - 4, 12, 5);
      c.fillStyle = '#111'; c.font = 'bold 9px sans-serif'; c.textAlign = 'center';
      c.fillText('SHERIFF', 0, 3);
    }
    if (v.type === 'pickup') {
      c.fillStyle = 'rgba(0,0,0,0.25)';
      c.fillRect(-L / 2 + 4, -W / 2 + 3, L * 0.3, W - 6);
    }
    // headlights
    c.fillStyle = '#ffe9a8';
    c.fillRect(L / 2 - 2, -W / 2 + 2, 3, 5); c.fillRect(L / 2 - 2, W / 2 - 7, 3, 5);
    // damage smoke
    if (v.health < 40) {
      c.fillStyle = 'rgba(80,80,80,0.5)';
      c.beginPath(); c.arc(-L / 4, 0, 6 + Math.random() * 4, 0, Math.PI * 2); c.fill();
    }
  }
  c.restore();
  // health bar for the player's car
  if (v.driver === 'player' && v.health < v.maxHealth) {
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(v.x - 24, v.y - v.wid / 2 - 12, 48, 5);
    c.fillStyle = v.health > 50 ? '#5da85d' : '#c94f3d';
    c.fillRect(v.x - 24, v.y - v.wid / 2 - 12, 48 * (v.health / v.maxHealth), 5);
  }
};

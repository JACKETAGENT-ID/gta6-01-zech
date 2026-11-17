'use strict';
// Wanted level + sheriff response: chase cars, roadblocks, arrest on foot.
// Wanted decays when the player stays clean and out of sight.
CH.policeCars = [];
CH.roadblocks = [];
CH.wantedTimer = 0;
CH.arrestT = 0;
CH.roadblockCooldown = 0;

CH.setWanted = function (n, reason) {
  var G = CH.G;
  n = CH.clamp(n, 0, 5);
  if (n > G.wanted) {
    G.wanted = n;
    CH.wantedTimer = 0;
    if (n >= 2) CH.showMsg('Sheriff mengejarmu! Wanted ' + n + ' bintang.');
  } else if (n < G.wanted) {
    G.wanted = n;
  }
};

CH.spawnPoliceCar = function () {
  var G = CH.G;
  var p = CH.randomRoadPoint();
  // Spawn on a road near the player but off-screen.
  for (var tries = 0; tries < 12; tries++) {
    var a = CH.rand(0, Math.PI * 2), d = CH.rand(700, 1100);
    var x = G.player.x + Math.cos(a) * d, y = G.player.y + Math.sin(a) * d;
    x = CH.clamp(x, 60, CH.WORLD_W - 60); y = CH.clamp(y, 60, CH.WORLD_H - 60);
    if (CH.pointOnRoad(x, y, 0)) { p = { x: x, y: y }; break; }
  }
  var v = CH.makeVehicle('police', p.x, p.y, 0, { driver: 'police', ai: 'chase' });
  v.speed = 300;
  CH.policeCars.push(v);
  return v;
};

CH.spawnRoadblock = function () {
  var G = CH.G;
  var v = G.player.vehicle;
  var fx = G.player.x, fy = G.player.y;
  var ang = v ? v.angle : G.player.angle;
  var bx = fx + Math.cos(ang) * 420, by = fy + Math.sin(ang) * 420;
  bx = CH.clamp(bx, 80, CH.WORLD_W - 80); by = CH.clamp(by, 80, CH.WORLD_H - 80);
  var block = { x: bx, y: by, angle: ang + Math.PI / 2, cars: [], t: 0 };
  var c1 = CH.makeVehicle('police', bx + Math.cos(block.angle) * 40, by + Math.sin(block.angle) * 40, block.angle, { driver: 'roadblock', ai: 'block' });
  var c2 = CH.makeVehicle('police', bx - Math.cos(block.angle) * 40, by - Math.sin(block.angle) * 40, block.angle, { driver: 'roadblock', ai: 'block' });
  c1.speed = 0; c2.speed = 0;
  block.cars = [c1, c2];
  CH.roadblocks.push(block);
  CH.showMsg('ROADBLOCK di depan! Cari jalan lain atau terobos.');
  CH.Audio.sfx('busted');
};

CH.updatePolice = function (dt) {
  var G = CH.G;
  if (G.state !== 'playing') return;
  CH.roadblockCooldown -= dt;
  // Wanted decay: 25 clean seconds drops one star.
  if (G.wanted > 0) {
    CH.wantedTimer += dt;
    if (CH.wantedTimer > 25) {
      CH.wantedTimer = 0;
      CH.setWanted(G.wanted - 1);
      if (G.wanted === 0) CH.showMsg('Kamu lolos. Wanted bersih.');
    }
  }
  // Keep the right number of cruisers on the road.
  var want = G.wanted > 0 ? Math.min(G.wanted * 2, 8) : 0;
  var active = CH.policeCars.filter(function (v) { return !v.dead; }).length;
  if (active < want && G.wanted > 0) CH.spawnPoliceCar();
  if (active > want) {
    var extra = CH.policeCars.filter(function (v) { return !v.dead; })[want];
    if (extra) { extra.dead = true; }
  }
  // Roadblocks at wanted 3+.
  if (G.wanted >= 3 && CH.roadblocks.length === 0 && CH.roadblockCooldown <= 0) {
    CH.spawnRoadblock();
    CH.roadblockCooldown = 30;
  }
  // Chase AI.
  for (var i = 0; i < CH.policeCars.length; i++) {
    var pv = CH.policeCars[i];
    if (pv.dead) continue;
    var d = CH.dist(pv.x, pv.y, G.player.x, G.player.y);
    var wantA = Math.atan2(G.player.y - pv.y, G.player.x - pv.x);
    var steer = CH.clamp(CH.angDiff(pv.angle, wantA) * 2.0, -1, 1);
    var throttle = d > 90 ? 1 : 0.4;
    if (d > 1400) { // too far: respawn closer
      var np = CH.randomRoadPoint();
      pv.x = np.x; pv.y = np.y; pv.speed = 300;
    }
    CH.drivePhysics(pv, throttle, steer, dt);
    // Ram the player's car.
    if (G.player.vehicle && d < (pv.len + G.player.vehicle.len) / 2 - 4) {
      G.player.vehicle.health -= 10 * dt;
      if (Math.abs(pv.speed - G.player.vehicle.speed) > 150) CH.shake(3);
    }
    // Arrest on foot: close and slow for 1.5 s.
    if (!G.player.vehicle && d < 46) {
      var pspeed = Math.hypot(G.player.vx || 0, G.player.vy || 0);
      if (pspeed < 60) {
        CH.arrestT += dt;
        if (CH.arrestT > 1.5) { CH.busted(); return; }
      } else CH.arrestT = 0;
    }
  }
  // Roadblock lifetime: fade out after the player passes far away.
  for (var r = 0; r < CH.roadblocks.length; r++) {
    var rb = CH.roadblocks[r];
    rb.t += dt;
    if (rb.t > 40 || CH.dist(rb.x, rb.y, G.player.x, G.player.y) > 1600) {
      rb.cars.forEach(function (c) { c.dead = true; });
      CH.roadblocks.splice(r, 1); r--;
    }
  }
  CH.policeCars = CH.policeCars.filter(function (v) { return !v.dead; });
  CH.Audio.setSiren(G.wanted > 0 && CH.policeCars.length > 0);
};

CH.busted = function () {
  var G = CH.G;
  if (G.state !== 'playing') return;
  G.state = 'busted';
  var fine = Math.min(G.money, 150);
  G.money -= fine;
  CH.Audio.sfx('busted');
  CH.Audio.setSiren(false);
  CH.showEnd('BUSTED', 'Sheriff menangkapmu di Copperhead County. Denda $' + fine + ' dipotong. Rook bebas lagi — untuk sekarang.');
  CH.saveGame();
};

CH.wasted = function () {
  var G = CH.G;
  if (G.state !== 'playing') return;
  G.state = 'wasted';
  CH.Audio.sfx('busted');
  CH.Audio.setSiren(false);
  CH.showEnd('WASTED', 'Rook tumbang di tengah gurun. Untung ada yang mengangkutmu ke klinik — tagihannya $100.');
  G.money = Math.max(0, G.money - 100);
  CH.saveGame();
};

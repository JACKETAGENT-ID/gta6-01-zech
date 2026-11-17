'use strict';
// Rook Calloway on foot and behind the wheel: movement, combat, pickups,
// copper nugget collectibles.
CH.bullets = [];

CH.initPlayer = function (x, y) {
  var G = CH.G;
  G.player = {
    x: x, y: y, angle: 0, vx: 0, vy: 0, onFoot: true, vehicle: null,
    health: 100, ammo: 24, money: 0, punchT: 0, shootT: 0, walkPhase: 0
  };
};

CH.updatePlayer = function (dt) {
  var G = CH.G, p = G.player, inp = CH.input;
  if (G.state !== 'playing') return;
  G.gunshotT = Math.max(0, (G.gunshotT || 0) - dt);
  p.punchT = Math.max(0, p.punchT - dt);
  p.shootT = Math.max(0, p.shootT - dt);
  if (p.onFoot) {
    var mx = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    var my = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
    var len = Math.hypot(mx, my);
    if (len > 0) {
      mx /= len; my /= len;
      p.angle = Math.atan2(my, mx);
      p.vx = mx * 230; p.vy = my * 230;
      p.walkPhase += dt * 10;
    } else { p.vx = 0; p.vy = 0; }
    var nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
    if (!CH.collidesBuilding(nx, p.y, 12)) p.x = nx;
    if (!CH.collidesBuilding(p.x, ny, 12)) p.y = ny;
    p.x = CH.clamp(p.x, 20, CH.WORLD_W - 20);
    p.y = CH.clamp(p.y, 20, CH.WORLD_H - 20);
    // Aim with the mouse while shooting.
    if (inp.mouseDown) p.angle = Math.atan2(inp.mouseWorldY - p.y, inp.mouseWorldX - p.x);
    if (inp.mouseDown && p.shootT <= 0) CH.shoot();
    // Slow health regen.
    p.health = Math.min(100, p.health + 1.5 * dt);
  } else if (p.vehicle) {
    CH.Audio.setEngine(Math.abs(p.vehicle.speed) / p.vehicle.maxSpeed, true);
  }
  // Punch: Space.
  if (inp.punch && p.punchT <= 0 && p.onFoot) {
    p.punchT = 0.45;
    CH.Audio.sfx('punch');
    for (var i = 0; i < CH.peds.length; i++) {
      var pd = CH.peds[i];
      if (pd.state !== 'down' && CH.dist(p.x, p.y, pd.x, pd.y) < 52) {
        pd.state = 'down'; pd.downT = 3;
        CH.setWanted(Math.min(5, G.wanted + 1), 'assault');
        CH.showMsg('Kamu memukul warga! Wanted naik.');
        break;
      }
    }
  }
  // Enter / exit car: E (edge-triggered in input.js via CH.tryEnterExit).
  // Bullets.
  for (var b = CH.bullets.length - 1; b >= 0; b--) {
    var bl = CH.bullets[b];
    bl.x += bl.vx * dt; bl.y += bl.vy * dt; bl.life -= dt;
    var dead = bl.life <= 0 || CH.collidesBuilding(bl.x, bl.y, 2);
    if (!dead) {
      for (var j = 0; j < CH.peds.length; j++) {
        var pd2 = CH.peds[j];
        if (pd2.state !== 'down' && CH.dist(bl.x, bl.y, pd2.x, pd2.y) < 12) {
          pd2.state = 'down'; pd2.downT = 5; dead = true;
          CH.setWanted(Math.min(5, G.wanted + 1), 'shooting');
          CH.spawnBurst(bl.x, bl.y, 6, '#c94f3d');
          break;
        }
      }
    }
    if (!dead) {
      for (var k = 0; k < CH.policeCars.length; k++) {
        var pv = CH.policeCars[k];
        if (!pv.dead && CH.circleRect(bl.x, bl.y, 4, pv.x - pv.len / 2, pv.y - pv.wid / 2, pv.len, pv.wid)) {
          pv.health -= 25; dead = true;
          CH.setWanted(Math.min(5, G.wanted + 2), 'shoot-cop');
          CH.spawnBurst(bl.x, bl.y, 8, '#ffcc00');
          break;
        }
      }
    }
    if (dead) CH.bullets.splice(b, 1);
  }
  // Pickups: ammo and health crates.
  for (var q = 0; q < CH.PICKUPS.length; q++) {
    var pk = CH.PICKUPS[q];
    if (pk.taken) continue;
    if (CH.dist(p.x, p.y, pk.x, pk.y) < 34) {
      pk.taken = true;
      if (pk.kind === 'ammo') { p.ammo += 24; CH.showMsg('Amunisi +24'); }
      else { p.health = 100; CH.showMsg('Kesehatan pulih penuh'); }
      CH.Audio.sfx('pickup');
    }
  }
  // Copper nuggets: 20 hidden across the county.
  for (var n = 0; n < CH.COLLECTIBLES.length; n++) {
    var cg = CH.COLLECTIBLES[n];
    if (cg.taken) continue;
    if (CH.dist(p.x, p.y, cg.x, cg.y) < 36) {
      cg.taken = true;
      G.money += 50;
      G.nuggets++;
      CH.Audio.sfx('coin');
      CH.spawnBurst(cg.x, cg.y, 10, '#e8a13c');
      CH.showMsg('Nugget tembaga! +$50 (' + G.nuggets + '/20)');
      CH.saveGame();
    }
  }
  // Player car destroyed while driving is handled in vehicles.js; on-foot
  // damage comes from police rams.
  for (var r = 0; r < CH.policeCars.length; r++) {
    var pc = CH.policeCars[r];
    if (!pc.dead && p.onFoot && CH.dist(p.x, p.y, pc.x, pc.y) < 34 && Math.abs(pc.speed) > 120) {
      p.health -= 25 * dt;
      CH.shake(4);
      if (p.health <= 0) CH.wasted();
    }
  }
  if (p.health <= 0 && G.state === 'playing') CH.wasted();
};

CH.shoot = function () {
  var G = CH.G, p = G.player;
  if (p.ammo <= 0) { CH.showMsg('Amunisi habis! Cari kotak amunisi.'); p.shootT = 0.4; return; }
  p.ammo--;
  p.shootT = 0.28;
  G.gunshotT = 1.2;
  var a = Math.atan2(CH.input.mouseWorldY - p.y, CH.input.mouseWorldX - p.x);
  CH.bullets.push({ x: p.x + Math.cos(a) * 20, y: p.y + Math.sin(a) * 20, vx: Math.cos(a) * 950, vy: Math.sin(a) * 950, life: 0.7 });
  CH.Audio.sfx('shot');
  CH.spawnBurst(p.x + Math.cos(a) * 24, p.y + Math.sin(a) * 24, 4, '#ffd94d');
};

CH.tryEnterExit = function () {
  var G = CH.G, p = G.player;
  if (G.state !== 'playing') return;
  if (!p.onFoot) { CH.exitVehicle(); return; }
  var v = CH.nearestVehicle(p.x, p.y, 70, null);
  if (v) CH.enterVehicle(v);
  else CH.showMsg('Tidak ada mobil di dekatmu.');
};

CH.drawPlayer = function (c) {
  var G = CH.G, p = G.player;
  if (!p.onFoot) return;
  c.save();
  c.translate(p.x, p.y);
  c.rotate(p.angle);
  var bob = Math.sin(p.walkPhase) * 2;
  c.fillStyle = 'rgba(0,0,0,0.3)';
  c.beginPath(); c.ellipse(0, 3, 10, 7, 0, 0, Math.PI * 2); c.fill();
  // legs
  c.fillStyle = '#2a3a55';
  c.fillRect(-6, -6 + bob, 10, 4); c.fillRect(-6, 2 - bob, 10, 4);
  // jacket — dusty brown, Rook's signature
  c.fillStyle = '#7a4a2a';
  c.fillRect(-7, -7, 14, 14);
  c.fillStyle = '#c9a06a';
  c.fillRect(4, -7, 4, 14);
  // head + hat
  c.fillStyle = '#e8b98a';
  c.beginPath(); c.arc(9, 0, 6, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#5a3a1a';
  c.fillRect(4, -8, 10, 4);
  c.fillRect(2, -6, 14, 3);
  // pistol when aiming
  if (CH.input.mouseDown) {
    c.fillStyle = '#222';
    c.fillRect(12, -2, 10, 4);
  }
  c.restore();
  // punch arc
  if (p.punchT > 0.25) {
    c.strokeStyle = 'rgba(255,220,120,0.8)'; c.lineWidth = 3;
    c.beginPath(); c.arc(p.x, p.y, 34, p.angle - 0.7, p.angle + 0.7); c.stroke();
  }
};

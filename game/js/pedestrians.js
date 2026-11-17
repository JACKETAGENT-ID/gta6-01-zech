'use strict';
// Pedestrians: town folk walking the sidewalks, fleeing from gunfire and
// speeding cars. Hitting one is a crime the sheriff notices.
CH.peds = [];
CH.PED_COLORS = ['#e8e8e8', '#d97ba8', '#3fa8a0', '#e8a13c', '#8a5fc9', '#5da85d', '#c94f3d', '#4d6a8a'];

CH.makePed = function (x, y) {
  var p = {
    x: x, y: y, angle: CH.rand(0, Math.PI * 2), speed: CH.rand(35, 65),
    state: 'walk', tx: x, ty: y, downT: 0, panic: 0,
    shirt: CH.pick(CH.PED_COLORS), skin: CH.pick(['#e8b98a', '#c98a5f', '#8a5a3a', '#f2c9a0'])
  };
  CH.peds.push(p);
  return p;
};

CH.spawnPeds = function () {
  CH.peds = [];
  for (var i = 0; i < 26; i++) {
    var pt = CH.randomRoadPoint();
    var p = CH.makePed(pt.x + CH.rand(-40, 40), pt.y + CH.rand(-40, 40));
    p.tx = pt.x; p.ty = pt.y;
  }
};

CH.updatePeds = function (dt) {
  var G = CH.G;
  for (var i = 0; i < CH.peds.length; i++) {
    var p = CH.peds[i];
    if (p.state === 'down') {
      p.downT -= dt;
      if (p.downT <= 0) { p.state = 'walk'; p.x += CH.rand(-200, 200); p.y += CH.rand(-200, 200); }
      continue;
    }
    var threat = null;
    if (G.player.vehicle) {
      var v = G.player.vehicle;
      if (Math.abs(v.speed) > 200 && CH.dist(p.x, p.y, v.x, v.y) < 130) threat = { x: v.x, y: v.y };
    }
    if (G.gunshotT > 0 && CH.dist(p.x, p.y, G.player.x, G.player.y) < 320) threat = { x: G.player.x, y: G.player.y };
    if (threat || p.state === 'flee') {
      p.state = 'flee'; p.panic = 2.5;
      var away = Math.atan2(p.y - (threat ? threat.y : G.player.y), p.x - (threat ? threat.x : G.player.x));
      p.angle = away;
      p.x += Math.cos(away) * 150 * dt;
      p.y += Math.sin(away) * 150 * dt;
      p.panic -= dt;
      if (p.panic <= 0) p.state = 'walk';
    } else {
      var d = CH.dist(p.x, p.y, p.tx, p.ty);
      if (d < 24) {
        var np = CH.randomRoadPoint();
        p.tx = np.x; p.ty = np.y;
      } else {
        p.angle = Math.atan2(p.ty - p.y, p.tx - p.x);
        p.x += Math.cos(p.angle) * p.speed * dt;
        p.y += Math.sin(p.angle) * p.speed * dt;
      }
    }
    if (CH.collidesBuilding(p.x, p.y, 8)) { p.x -= Math.cos(p.angle) * p.speed * dt * 2; p.y -= Math.sin(p.angle) * p.speed * dt * 2; }
    p.x = CH.clamp(p.x, 20, CH.WORLD_W - 20);
    p.y = CH.clamp(p.y, 20, CH.WORLD_H - 20);
  }
  // Player's car hitting a pedestrian.
  if (G.player.vehicle) {
    var v = G.player.vehicle;
    for (var j = 0; j < CH.peds.length; j++) {
      var pd = CH.peds[j];
      if (pd.state === 'down') continue;
      if (CH.circleRect(pd.x, pd.y, 10, v.x - v.len / 2, v.y - v.wid / 2, v.len, v.wid) && Math.abs(v.speed) > 40) {
        pd.state = 'down'; pd.downT = 4;
        CH.setWanted(Math.min(5, G.wanted + 1), 'hit-ped');
        CH.showMsg('Kamu menabrak pejalan kaki! Wanted naik.');
        CH.Audio.sfx('crash'); CH.shake(5);
        CH.spawnBurst(pd.x, pd.y, 8, '#c94f3d');
      }
    }
  }
};

CH.drawPed = function (c, p) {
  c.save();
  c.translate(p.x, p.y);
  if (p.state === 'down') { c.rotate(Math.PI / 2); c.globalAlpha = 0.7; }
  else c.rotate(p.angle);
  c.fillStyle = 'rgba(0,0,0,0.3)';
  c.beginPath(); c.ellipse(0, 2, 9, 7, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = p.shirt;
  c.fillRect(-6, -5, 12, 10);
  c.fillStyle = p.skin;
  c.beginPath(); c.arc(8, 0, 5, 0, Math.PI * 2); c.fill();
  c.restore();
};

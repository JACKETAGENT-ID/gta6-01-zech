'use strict';
// HUD: wanted stars, health, money, objective, speed, clock, radio, minimap.
CH.msgT = 0;
CH.showMsg = function (text) {
  var el = document.getElementById('msg');
  if (el) { el.textContent = text; el.style.opacity = '1'; }
  CH.msgT = 4;
};

CH.showEnd = function (title, text) {
  var sc = document.getElementById('endScreen');
  var t = document.getElementById('endTitle');
  var b = document.getElementById('endText');
  if (sc && t && b) {
    t.textContent = title; b.textContent = text;
    sc.style.display = 'flex';
  }
};

CH.updateHUD = function () {
  var G = CH.G;
  if (CH.msgT > 0) {
    CH.msgT -= 1 / 60;
    if (CH.msgT <= 0) {
      var el = document.getElementById('msg');
      if (el) el.style.opacity = '0';
    }
  }
  var set = function (id, txt) { var e = document.getElementById(id); if (e && e.textContent !== txt) e.textContent = txt; };
  var stars = '';
  for (var i = 0; i < 5; i++) stars += (i < G.wanted) ? '★' : '☆';
  set('stars', stars);
  set('money', CH.fmtMoney(G.money));
  set('ammo', 'AMMO ' + G.player.ammo);
  set('collect', 'NUGGET ' + G.nuggets + '/20');
  set('clock', CH.fmtClock(G.timeOfDay));
  set('radio', CH.Audio.stations[CH.Audio.radioStation].name);
  var spd = G.player.vehicle ? Math.round(Math.abs(G.player.vehicle.speed) * 0.12) : 0;
  set('speed', G.player.vehicle ? spd + ' mph' : '');
  var obj = 'Bebas — jelajahi Copperhead County';
  var s = CH.currentStep();
  if (s) obj = 'MISI: ' + s.label;
  else if (CH.mission) obj = 'MISI: ' + CH.mission.def.name;
  else if (G.missionsDone.length < CH.MISSIONS.length) obj = 'Misi berikutnya: ' + CH.MISSIONS[G.missionsDone.length].name;
  set('objective', obj);
  var hf = document.getElementById('healthFill');
  if (hf) hf.style.width = Math.max(0, G.player.health) + '%';
  var cf = document.getElementById('carFill');
  var cw = document.getElementById('carHealth');
  if (cf && cw) {
    if (G.player.vehicle) {
      cw.style.display = 'block';
      cf.style.width = Math.max(0, G.player.vehicle.health / G.player.vehicle.maxHealth * 100) + '%';
    } else cw.style.display = 'none';
  }
  var wt = document.getElementById('wantedLabel');
  if (wt) wt.style.color = G.wanted >= 3 ? '#ff5a4d' : '#ffd94d';
  CH.drawMinimap();
};

CH.drawMinimap = function () {
  var cv = document.getElementById('minimap');
  if (!cv) return;
  var c = cv.getContext('2d');
  var sx = 200 / CH.WORLD_W, sy = 150 / CH.WORLD_H;
  c.fillStyle = '#c9a05f'; c.fillRect(0, 0, 200, 150);
  c.fillStyle = '#4a4a52';
  for (var i = 0; i < CH.ROADS.length; i++) {
    var r = CH.ROADS[i];
    c.fillRect(r.x * sx, r.y * sy, Math.max(1, r.w * sx), Math.max(1, r.h * sy));
  }
  c.fillStyle = '#7a2e4d';
  var k;
  for (k in CH.LANDMARKS) {
    var lm = CH.LANDMARKS[k];
    if (lm.casino) c.fillRect(lm.x * sx, lm.y * sy, lm.w * sx, lm.h * sy);
  }
  // collectibles
  c.fillStyle = '#ff8c1a';
  for (var n = 0; n < CH.COLLECTIBLES.length; n++) {
    var cg = CH.COLLECTIBLES[n];
    if (!cg.taken) c.fillRect(cg.x * sx - 1, cg.y * sy - 1, 2, 2);
  }
  // traffic
  c.fillStyle = '#dddddd';
  for (var v = 0; v < CH.vehicles.length; v++) {
    var vv = CH.vehicles[v];
    if (vv.driver === 'traffic') c.fillRect(vv.x * sx - 1, vv.y * sy - 1, 2, 2);
  }
  // police
  c.fillStyle = '#2a6aff';
  for (var p = 0; p < CH.policeCars.length; p++) {
    var pc = CH.policeCars[p];
    if (!pc.dead) { c.beginPath(); c.arc(pc.x * sx, pc.y * sy, 3, 0, Math.PI * 2); c.fill(); }
  }
  // mission marker
  var mk = CH.missionMarker();
  if (mk) {
    var pulse = 3 + Math.sin(CH.G.time * 5) * 1.5;
    c.fillStyle = '#ffd94d';
    c.beginPath(); c.arc(mk.x * sx, mk.y * sy, pulse, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#7a5a00'; c.stroke();
  }
  // player arrow
  var G = CH.G;
  c.save();
  c.translate(G.player.x * sx, G.player.y * sy);
  c.rotate(G.player.angle);
  c.fillStyle = '#ffffff';
  c.beginPath(); c.moveTo(6, 0); c.lineTo(-4, -4); c.lineTo(-4, 4); c.closePath(); c.fill();
  c.strokeStyle = '#000'; c.stroke();
  c.restore();
  // border
  c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 2;
  c.strokeRect(0, 0, 200, 150);
};

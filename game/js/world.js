'use strict';
// Copperhead County: the map. Desert town grid, a long highway, a casino strip.
// All layout is generated from a fixed seed so every run looks the same.
CH.WORLD_W = 3600;
CH.WORLD_H = 2600;

CH.ROADS = [
  { x: 480, y: 300, w: 100, h: 1400 }, { x: 880, y: 300, w: 100, h: 1400 },
  { x: 1280, y: 300, w: 100, h: 1400 }, { x: 1680, y: 300, w: 100, h: 1400 },
  { x: 420, y: 360, w: 1380, h: 100 }, { x: 420, y: 760, w: 1380, h: 100 },
  { x: 420, y: 1160, w: 1380, h: 100 }, { x: 420, y: 1560, w: 1380, h: 100 },
  { x: 420, y: 120, w: 2780, h: 90 },
  { x: 3000, y: 120, w: 100, h: 2000 },
  { x: 2500, y: 1560, w: 120, h: 680 },
  { x: 1680, y: 1860, w: 1920, h: 110 },
  { x: 0, y: 2060, w: 3600, h: 180 }
];

CH.LANDMARKS = {
  garage: { x: 620, y: 230, w: 170, h: 100, name: "Rook's Garage" },
  diner: { x: 1020, y: 480, w: 190, h: 120, name: 'Coyote Diner' },
  motel: { x: 1420, y: 880, w: 200, h: 120, name: 'Copper Rest Motel' },
  sheriff: { x: 620, y: 880, w: 170, h: 110, name: "Sheriff's Office" },
  gas: { x: 1020, y: 1280, w: 190, h: 130, name: 'Fill-Up Gas' },
  paint: { x: 1420, y: 1280, w: 170, h: 110, name: 'Chrome Paint Shop' },
  junkyard: { x: 120, y: 1800, w: 300, h: 220, name: 'Junkyard' },
  spur: { x: 2700, y: 1660, w: 260, h: 150, name: 'The Copper Spur', casino: true },
  rose: { x: 3020, y: 1660, w: 260, h: 150, name: 'Desert Rose Casino', casino: true },
  coyote: { x: 2700, y: 2280, w: 240, h: 130, name: 'Lucky Coyote', casino: true },
  goldpan: { x: 3020, y: 2280, w: 260, h: 130, name: 'Gold Pan Saloon', casino: true }
};

CH.BUILDINGS = [];
CH.CACTI = [];
CH.ROCKS = [];
CH.COLLECTIBLES = [];
CH.PICKUPS = [];
CH.TRAFFIC_LOOPS = [
  [[530, 410], [1730, 410], [1730, 1610], [530, 1610]],
  [[100, 2145], [3500, 2145], [3500, 2175], [100, 2175]],
  [[2560, 1620], [2560, 2130], [3500, 2130], [3500, 2175], [2560, 2175]]
];
CH.staticLayer = null;

CH.pointOnRoad = function (x, y, pad) {
  pad = pad || 0;
  for (var i = 0; i < CH.ROADS.length; i++) {
    var r = CH.ROADS[i];
    if (x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad) return true;
  }
  return false;
};

CH.collidesBuilding = function (x, y, r) {
  for (var i = 0; i < CH.BUILDINGS.length; i++) {
    var b = CH.BUILDINGS[i];
    if (CH.circleRect(x, y, r, b.x, b.y, b.w, b.h)) return b;
  }
  return null;
};

CH.randomRoadPoint = function () {
  var r = CH.pick(CH.ROADS);
  return { x: CH.rand(r.x + 25, r.x + r.w - 25), y: CH.rand(r.y + 25, r.y + r.h - 25) };
};

CH.buildWorld = function () {
  CH.reseed(20261117);
  CH.BUILDINGS = [];
  var lm, k;
  for (k in CH.LANDMARKS) { lm = CH.LANDMARKS[k]; CH.BUILDINGS.push({ x: lm.x, y: lm.y, w: lm.w, h: lm.h, name: lm.name, casino: !!lm.casino, color: lm.casino ? '#7a2e4d' : '#b97a4e' }); }
  var palette = ['#c98f5f', '#b97a4e', '#d9a066', '#a86f4a', '#8fa3a8', '#c2b280', '#9c6b4f', '#7d8a6a'];
  var xs = [[600, 860], [1000, 1260], [1400, 1660]];
  var ys = [[230, 340], [480, 740], [880, 1140], [1280, 1540]];
  var taken = { '0,0': 1, '1,1': 1, '2,2': 1, '0,2': 1, '1,3': 1, '2,3': 1 };
  for (var cx = 0; cx < 3; cx++) {
    for (var cy = 0; cy < 4; cy++) {
      if (taken[cx + ',' + cy]) continue;
      var n = CH.randInt(1, 2);
      for (var j = 0; j < n; j++) {
        var bw = CH.randInt(70, 130), bh = CH.randInt(60, 110);
        var bx = CH.rand(xs[cx][0], xs[cx][1] - bw), by = CH.rand(ys[cy][0], ys[cy][1] - bh);
        CH.BUILDINGS.push({ x: bx, y: by, w: bw, h: bh, color: CH.pick(palette) });
      }
    }
  }
  // 20 copper nugget collectibles, spread across town, strip and desert.
  CH.COLLECTIBLES = [];
  var tries = 0;
  while (CH.COLLECTIBLES.length < 20 && tries < 900) {
    tries++;
    var px = CH.rand(80, CH.WORLD_W - 80), py = CH.rand(80, CH.WORLD_H - 80);
    if (CH.collidesBuilding(px, py, 30)) continue;
    var ok = true;
    for (var c = 0; c < CH.COLLECTIBLES.length; c++) {
      if (CH.dist(px, py, CH.COLLECTIBLES[c].x, CH.COLLECTIBLES[c].y) < 180) { ok = false; break; }
    }
    if (ok) CH.COLLECTIBLES.push({ id: CH.COLLECTIBLES.length, x: px, y: py, taken: false });
  }
  CH.PICKUPS = [
    { x: 1115, y: 1345, kind: 'ammo', taken: false },
    { x: 1115, y: 540, kind: 'health', taken: false },
    { x: 270, y: 1910, kind: 'ammo', taken: false },
    { x: 1520, y: 940, kind: 'health', taken: false }
  ];
  CH.CACTI = [];
  for (var i = 0; i < 240; i++) {
    var ax = CH.rand(40, CH.WORLD_W - 40), ay = CH.rand(40, CH.WORLD_H - 40);
    if (CH.pointOnRoad(ax, ay, 30) || CH.collidesBuilding(ax, ay, 30)) continue;
    CH.CACTI.push({ x: ax, y: ay, s: CH.rand(0.7, 1.5) });
  }
  CH.ROCKS = [];
  for (var r2 = 0; r2 < 160; r2++) {
    var rx = CH.rand(40, CH.WORLD_W - 40), ry = CH.rand(40, CH.WORLD_H - 40);
    if (CH.pointOnRoad(rx, ry, 20) || CH.collidesBuilding(rx, ry, 20)) continue;
    CH.ROCKS.push({ x: rx, y: ry, s: CH.rand(0.6, 1.6) });
  }
  CH.renderStaticLayer();
};

// Pre-render the ground, roads and buildings once: the camera just blits it.
CH.renderStaticLayer = function () {
  var cv = document.createElement('canvas');
  cv.width = CH.WORLD_W; cv.height = CH.WORLD_H;
  var c = cv.getContext('2d');
  c.fillStyle = '#d9a05f'; c.fillRect(0, 0, CH.WORLD_W, CH.WORLD_H);
  var rng = CH.mulberry32(777);
  for (var i = 0; i < 9000; i++) {
    var sx = rng() * CH.WORLD_W, sy = rng() * CH.WORLD_H;
    c.fillStyle = rng() > 0.5 ? 'rgba(120,70,30,0.10)' : 'rgba(255,220,160,0.10)';
    c.fillRect(sx, sy, 3, 3);
  }
  // desert dunes, west and south
  c.fillStyle = 'rgba(190,130,70,0.35)';
  for (var d = 0; d < 26; d++) {
    var dx = rng() * CH.WORLD_W, dy = rng() * CH.WORLD_H;
    c.beginPath(); c.ellipse(dx, dy, 120 + rng() * 200, 30 + rng() * 50, rng() * 3, 0, Math.PI * 2); c.fill();
  }
  // roads
  for (var r = 0; r < CH.ROADS.length; r++) {
    var rd = CH.ROADS[r];
    c.fillStyle = r.y >= 2060 ? '#3d3d46' : '#4a4a52';
    c.fillRect(rd.x, rd.y, rd.w, rd.h);
    c.strokeStyle = '#c8c8c8'; c.lineWidth = 2;
    c.strokeRect(rd.x + 2, rd.y + 2, rd.w - 4, rd.h - 4);
    c.strokeStyle = '#e8c33c'; c.lineWidth = 3; c.setLineDash([26, 26]);
    c.beginPath();
    if (rd.w > rd.h) { var my = rd.y + rd.h / 2; c.moveTo(rd.x + 8, my); c.lineTo(rd.x + rd.w - 8, my); }
    else { var mx = rd.x + rd.w / 2; c.moveTo(mx, rd.y + 8); c.lineTo(mx, rd.y + rd.h - 8); }
    c.stroke(); c.setLineDash([]);
  }
  // highway edge lines
  c.strokeStyle = '#f2f2f2'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(0, 2072); c.lineTo(CH.WORLD_W, 2072); c.moveTo(0, 2228); c.lineTo(CH.WORLD_W, 2228); c.stroke();
  // buildings
  for (var b = 0; b < CH.BUILDINGS.length; b++) {
    var bd = CH.BUILDINGS[b];
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(bd.x + 6, bd.y + 8, bd.w, bd.h);
    c.fillStyle = bd.color; c.fillRect(bd.x, bd.y, bd.w, bd.h);
    c.fillStyle = 'rgba(255,255,255,0.16)'; c.fillRect(bd.x, bd.y, bd.w, 10);
    c.strokeStyle = 'rgba(60,30,10,0.6)'; c.lineWidth = 2; c.strokeRect(bd.x, bd.y, bd.w, bd.h);
    if (bd.casino) {
      c.fillStyle = '#ffd94d'; c.fillRect(bd.x - 4, bd.y - 14, bd.w + 8, 16);
      c.fillStyle = '#5b1030'; c.font = 'bold 13px sans-serif'; c.textAlign = 'center';
      c.fillText(bd.name.toUpperCase(), bd.x + bd.w / 2, bd.y - 2);
    } else if (bd.name) {
      c.fillStyle = 'rgba(40,20,5,0.85)'; c.font = 'bold 12px sans-serif'; c.textAlign = 'center';
      c.fillText(bd.name.toUpperCase(), bd.x + bd.w / 2, bd.y + bd.h / 2 + 4);
    }
  }
  // rocks and cacti
  for (var k = 0; k < CH.ROCKS.length; k++) {
    var rk = CH.ROCKS[k];
    c.fillStyle = '#8a6a4a';
    c.beginPath(); c.ellipse(rk.x, rk.y, 14 * rk.s, 10 * rk.s, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#a8845e';
    c.beginPath(); c.ellipse(rk.x - 3 * rk.s, rk.y - 3 * rk.s, 8 * rk.s, 6 * rk.s, 0, 0, Math.PI * 2); c.fill();
  }
  for (var cc = 0; cc < CH.CACTI.length; cc++) {
    var ca = CH.CACTI[cc], s = ca.s;
    c.strokeStyle = '#3f7a3a'; c.lineWidth = 7 * s; c.lineCap = 'round';
    c.beginPath(); c.moveTo(ca.x, ca.y + 16 * s); c.lineTo(ca.x, ca.y - 16 * s); c.stroke();
    c.beginPath(); c.moveTo(ca.x, ca.y - 2 * s); c.lineTo(ca.x - 11 * s, ca.y - 2 * s); c.lineTo(ca.x - 11 * s, ca.y - 12 * s); c.stroke();
    c.beginPath(); c.moveTo(ca.x, ca.y + 4 * s); c.lineTo(ca.x + 11 * s, ca.y + 4 * s); c.lineTo(ca.x + 11 * s, ca.y - 6 * s); c.stroke();
  }
  CH.staticLayer = cv;
};

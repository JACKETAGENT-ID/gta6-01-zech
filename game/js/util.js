'use strict';
window.CH = window.CH || {};
CH.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
CH.lerp = function (a, b, t) { return a + (b - a) * t; };
CH.dist = function (x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); };
CH.angDiff = function (a, b) {
  var d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
};
CH.mulberry32 = function (seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};
CH.rng = CH.mulberry32(20261117);
CH.reseed = function (seed) { CH.rng = CH.mulberry32(seed); };
CH.rand = function (a, b) { return a + CH.rng() * (b - a); };
CH.randInt = function (a, b) { return Math.floor(CH.rand(a, b + 1)); };
CH.pick = function (arr) { return arr[Math.floor(CH.rng() * arr.length)]; };
CH.circleRect = function (cx, cy, r, rx, ry, rw, rh) {
  var nx = CH.clamp(cx, rx, rx + rw), ny = CH.clamp(cy, ry, ry + rh);
  var dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy < r * r;
};
CH.rectsOverlap = function (a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
};
CH.fmtMoney = function (n) { return '$' + Math.floor(n).toLocaleString('en-US'); };
CH.fmtClock = function (hours) {
  var h = Math.floor(hours) % 24, m = Math.floor((hours % 1) * 60);
  var ap = h >= 12 ? 'PM' : 'AM';
  var hh = h % 12; if (hh === 0) hh = 12;
  return hh + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
};

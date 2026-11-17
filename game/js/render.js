'use strict';
// Renderer: blits the pre-rendered county, then draws everything dynamic
// (collectibles, pickups, cars, people, the player, particles, markers),
// then the light of the hour and the dust.
CH.render = function () {
  var G = CH.G;
  var c = G.ctx;
  var shx = (Math.random() * 2 - 1) * CH.shakeMag;
  var shy = (Math.random() * 2 - 1) * CH.shakeMag;
  var camX = G.cam.x + shx, camY = G.cam.y + shy;
  c.save();
  c.clearRect(0, 0, 1280, 800);
  c.translate(-Math.round(camX), -Math.round(camY));
  // Static county.
  if (CH.staticLayer) c.drawImage(CH.staticLayer, 0, 0);
  // Copper nuggets.
  for (var n = 0; n < CH.COLLECTIBLES.length; n++) {
    var cg = CH.COLLECTIBLES[n];
    if (cg.taken) continue;
    var bob = Math.sin(G.time * 3 + cg.id) * 3;
    c.fillStyle = '#e8a13c';
    c.beginPath(); c.arc(cg.x, cg.y + bob, 9, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffd94d';
    c.beginPath(); c.arc(cg.x - 2, cg.y + bob - 2, 4, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#7a4a00'; c.lineWidth = 2;
    c.beginPath(); c.arc(cg.x, cg.y + bob, 9, 0, Math.PI * 2); c.stroke();
  }
  // Pickups.
  for (var q = 0; q < CH.PICKUPS.length; q++) {
    var pk = CH.PICKUPS[q];
    if (pk.taken) continue;
    c.fillStyle = pk.kind === 'ammo' ? '#3d7ac9' : '#5da85d';
    c.fillRect(pk.x - 12, pk.y - 12, 24, 24);
    c.fillStyle = '#fff'; c.font = 'bold 13px sans-serif'; c.textAlign = 'center';
    c.fillText(pk.kind === 'ammo' ? 'AMMO' : '+', pk.x, pk.y + 5);
    c.strokeStyle = '#000'; c.strokeRect(pk.x - 12, pk.y - 12, 24, 24);
  }
  // Mission marker on the ground.
  var mk = CH.missionMarker();
  if (mk) {
    var pulse = 26 + Math.sin(G.time * 4) * 6;
    c.strokeStyle = '#ffd94d'; c.lineWidth = 4;
    c.beginPath(); c.arc(mk.x, mk.y, pulse, 0, Math.PI * 2); c.stroke();
    c.fillStyle = 'rgba(255,217,77,0.25)';
    c.beginPath(); c.arc(mk.x, mk.y, pulse, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffd94d';
    c.beginPath();
    c.moveTo(mk.x, mk.y - 34); c.lineTo(mk.x + 10, mk.y - 16); c.lineTo(mk.x - 10, mk.y - 16);
    c.closePath(); c.fill();
  }
  // Vehicles, people, player, bullets, particles.
  for (var v = 0; v < CH.vehicles.length; v++) {
    if (!CH.vehicles[v].dead) CH.drawVehicle(c, CH.vehicles[v]);
  }
  for (var p = 0; p < CH.peds.length; p++) CH.drawPed(c, CH.peds[p]);
  CH.drawPlayer(c);
  c.fillStyle = '#ffd94d';
  for (var b = 0; b < CH.bullets.length; b++) {
    var bl = CH.bullets[b];
    c.beginPath(); c.arc(bl.x, bl.y, 3, 0, Math.PI * 2); c.fill();
  }
  CH.drawParticles(c);
  // County-line sign for the final mission.
  c.fillStyle = '#2a4a2a'; c.fillRect(3490, 2100, 8, 90);
  c.fillStyle = '#e8e8d8'; c.fillRect(3440, 2060, 110, 44);
  c.fillStyle = '#1a1a1a'; c.font = 'bold 11px sans-serif'; c.textAlign = 'center';
  c.fillText('COUNTY LINE', 3495, 2078);
  c.fillText('COPPERHEAD', 3495, 2094);
  c.restore();
  // Screen-space overlays: daylight, dust, vignette, off-screen marker arrow.
  var ov = CH.dayOverlay();
  if (ov) {
    c.fillStyle = 'rgba(' + ov.color + ',' + ov.alpha + ')';
    c.fillRect(0, 0, 1280, 800);
  }
  CH.drawDustOverlay(c, 1280, 800);
  var grad = c.createRadialGradient(640, 400, 420, 640, 400, 780);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.28)');
  c.fillStyle = grad;
  c.fillRect(0, 0, 1280, 800);
  // Arrow toward an off-screen mission marker.
  if (mk) {
    var sx = mk.x - camX, sy = mk.y - camY;
    if (sx < 60 || sx > 1220 || sy < 60 || sy > 740) {
      var ax = CH.clamp(sx, 60, 1220), ay = CH.clamp(sy, 200, 740);
      var aa = Math.atan2(sy - ay, sx - ax);
      c.save();
      c.translate(ax, ay); c.rotate(aa);
      c.fillStyle = '#ffd94d';
      c.beginPath(); c.moveTo(18, 0); c.lineTo(-10, -12); c.lineTo(-10, 12); c.closePath(); c.fill();
      c.restore();
      c.fillStyle = '#ffd94d'; c.font = 'bold 14px sans-serif'; c.textAlign = 'center';
      c.fillText(Math.round(CH.dist(G.player.x, G.player.y, mk.x, mk.y) / 10) + 'm', ax, ay + 30);
    }
  }
};

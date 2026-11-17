'use strict';
// Save / load via localStorage. Progress: money, missions, nuggets, position.
CH.SAVE_KEY = 'copperhead-county-save-v1';

CH.saveGame = function () {
  var G = CH.G;
  if (!G || !G.player) return;
  try {
    var data = {
      money: G.money,
      missionsDone: G.missionsDone,
      nuggets: G.nuggets,
      nuggetIds: CH.COLLECTIBLES.filter(function (c) { return c.taken; }).map(function (c) { return c.id; }),
      player: { x: G.player.x, y: G.player.y, health: G.player.health, ammo: G.player.ammo },
      timeOfDay: G.timeOfDay,
      savedAt: Date.now()
    };
    localStorage.setItem(CH.SAVE_KEY, JSON.stringify(data));
  } catch (e) { /* storage unavailable: play on without saving */ }
};

CH.loadGame = function () {
  try {
    var raw = localStorage.getItem(CH.SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
};

CH.clearSave = function () {
  try { localStorage.removeItem(CH.SAVE_KEY); } catch (e) { /* ignore */ }
};

CH.applySave = function (data) {
  var G = CH.G;
  if (!data) return false;
  G.money = data.money || 0;
  G.missionsDone = data.missionsDone || [];
  G.nuggets = data.nuggets || 0;
  (data.nuggetIds || []).forEach(function (id) {
    var c = CH.COLLECTIBLES[id];
    if (c) c.taken = true;
  });
  if (data.player) {
    G.player.x = data.player.x; G.player.y = data.player.y;
    G.player.health = data.player.health || 100;
    G.player.ammo = data.player.ammo || 24;
  }
  if (typeof data.timeOfDay === 'number') G.timeOfDay = data.timeOfDay;
  return true;
};

CH.hasSave = function () { return !!CH.loadGame(); };

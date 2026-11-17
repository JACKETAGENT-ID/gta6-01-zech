// Save / load through localStorage. Auto-saves after every mission.
const KEY = 'copperhead-county-save-v1';

export function saveGame(G) {
  try {
    const p = G.player;
    const data = {
      cash: p.cash, debt: p.debt, hp: p.hp, ammo: p.ammo,
      x: p.x, y: p.y, missionIdx: G.mission.idx, missionStage: G.mission.stage,
      nuggets: G.nuggets.filter(n => n.taken).length,
      nuggetTaken: G.nuggets.map(n => n.taken),
      dayTime: G.dayTime, stats: G.stats, savedAt: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch (e) { return false; }
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (typeof d.cash !== 'number' || typeof d.missionIdx !== 'number') return null;
    return d;
  } catch (e) { return null; }
}

export function hasSave() { return loadSave() !== null; }

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch (e) { /* storage unavailable */ }
}

export function applySave(G, d) {
  const p = G.player;
  p.cash = d.cash; p.debt = d.debt; p.hp = d.hp; p.ammo = d.ammo;
  p.x = d.x; p.y = d.y;
  p.onFoot = true; p.car = null;
  G.mission.idx = Math.min(d.missionIdx, 5);
  G.mission.stage = 0;
  G.mission.done = false;
  if (Array.isArray(d.nuggetTaken)) {
    d.nuggetTaken.forEach((t, i) => { if (G.nuggets[i]) G.nuggets[i].taken = !!t; });
  }
  if (typeof d.dayTime === 'number') G.dayTime = d.dayTime;
  if (d.stats) G.stats = { ...G.stats, ...d.stats };
}

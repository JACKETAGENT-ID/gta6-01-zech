// Copper nuggets: 20 collectibles hidden around the county.
// Each is worth $25 and counts toward the Copper Stash mission.
import { NUGGET_COUNT, NUGGET_VALUE } from './config.js';

export function spawnNuggets(G) {
  G.nuggets = G.world.nuggetSpots.map((s, i) => ({
    x: s.x, y: s.y, taken: false, phase: i * 0.7, bob: 0,
  }));
  G.nuggetTotal = NUGGET_COUNT;
}

export function updateCollectibles(G, dt) {
  const p = G.player;
  for (const n of G.nuggets) {
    if (n.taken) continue;
    n.bob += dt;
    const d = Math.hypot(p.x - n.x, p.y - n.y);
    if (d < 30) {
      n.taken = true;
      p.cash += NUGGET_VALUE;
      G.stats.nuggets++;
      G.audio.pickup();
      G.addMessage('Copper nugget +$' + NUGGET_VALUE + ' (' + G.stats.nuggets + '/' + NUGGET_COUNT + ')');
      G.spawnParticles(n.x, n.y, '#f2b234', 10);
      if (G.mission) G.mission.onNugget(G);
    }
  }
}

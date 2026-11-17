// Six story missions for Rook Calloway: dialogue, objectives, rewards.
// Completing the last one clears the $4,000 debt to Vera Voss.
import { MISSIONS, DEBT_TOTAL } from './config.js';
import { clamp } from './rng.js';

export function makeMissionSystem(G) {
  return {
    idx: 0,
    stage: 0,
    dialogue: null, // { lines, i } — shown until player presses E
    stageTimer: 0,
    stageState: {},
    done: false,

    current() { return MISSIONS[this.idx] || null; },
    stageDef() {
      const m = this.current();
      return m ? m.stages[this.stage] : null;
    },
    objectiveText() {
      if (this.done) return 'Debt paid! Copperhead County is yours, Rook.';
      const m = this.current();
      if (!m) return '';
      if (this.dialogue) return 'Talk to ' + m.giver + ' (press E)';
      const s = this.stageDef();
      return s ? s.text : '';
    },
    start(G) {
      const m = this.current();
      if (!m) return;
      this.dialogue = { lines: m.intro, i: 0 };
      this.stage = 0;
      this.stageState = {};
      this.stageTimer = 0;
    },
    advanceDialogue(G) {
      if (!this.dialogue) return;
      this.dialogue.i++;
      if (this.dialogue.i >= this.dialogue.lines.length) {
        this.dialogue = null;
        const s = this.stageDef();
        if (s && s.type === 'escape') {
          G.wanted = Math.max(G.wanted, s.wanted || 3);
          G.wantedTimer = 0;
        }
        if (s && s.timer) this.stageTimer = s.timer;
      }
      G.audio.click();
    },
    onNugget(G) {
      const s = this.stageDef();
      if (!s || s.type !== 'collect' || this.dialogue) return;
      this.stageState.count = (this.stageState.count || 0) + 1;
      if (this.stageState.count >= s.count) this.completeStage(G);
    },
    onSteal(G, car) {
      const s = this.stageDef();
      if (!s || s.type !== 'steal' || this.dialogue) return;
      // Mission 1 wants the red sedan; mission 6 wants Vera's van.
      const wantVan = this.idx === 5;
      if (wantVan && car.type !== 'van') return;
      if (!wantVan && car.type !== 'sedan') return;
      this.completeStage(G);
    },
    update(G, dt) {
      if (this.done || this.dialogue) return;
      const m = this.current();
      if (!m) return;
      const s = this.stageDef();
      if (!s) return;
      const p = G.player;
      if (s.timer && this.stageTimer > 0) {
        this.stageTimer -= dt;
        if (this.stageTimer <= 0) {
          if (s.type === 'escape') {
            // Survived the heat: now reach the hideout.
            this.stageTimer = 0;
            G.addMessage('You survived the heat — get to the hideout!');
            return;
          }
          // Timer ran out: mission failed, restart it.
          G.addMessage('Too slow! ' + m.name + ' failed — try again.');
          G.stats.missionsFailed++;
          this.start(G);
          return;
        }
      }
      if (s.type === 'goto' || s.type === 'escape') {
        const d = Math.hypot(p.x - s.x, p.y - s.y);
        if (s.needCar && p.onFoot) return;
        if (s.carType && (!p.car || p.car.type !== s.carType)) return;
        if (s.type === 'escape' && s.timer && this.stageTimer > 0) return; // wait out the timer first
        if (d < s.r) this.completeStage(G);
      }
    },
    completeStage(G) {
      const m = this.current();
      const s = this.stageDef();
      this.stage++;
      G.audio.mission();
      G.addMessage('Objective complete: ' + (s ? s.text : ''));
      if (this.stage >= m.stages.length) this.completeMission(G);
      else {
        const ns = this.stageDef();
        if (ns && ns.timer) this.stageTimer = ns.timer;
        if (ns && ns.type === 'escape') { G.wanted = Math.max(G.wanted, ns.wanted || 3); G.wantedTimer = 0; }
      }
    },
    completeMission(G) {
      const m = this.current();
      const p = G.player;
      p.cash += m.reward;
      p.debt = Math.max(0, p.debt - m.reward);
      G.stats.missionsDone++;
      G.addMessage(m.name + ' complete! +$' + m.reward + ' — debt left: $' + p.debt);
      G.audio.mission();
      if (this.idx >= MISSIONS.length - 1) {
        this.done = true;
        p.debt = 0;
        G.mode = 'win';
        return;
      }
      this.idx++;
      this.start(G);
    },
  };
}

export function missionMarker(G) {
  const ms = G.mission;
  if (!ms || ms.done || ms.dialogue) return null;
  const s = ms.stageDef();
  if (!s || s.x === undefined) return null;
  return { x: s.x, y: s.y, r: s.r || 100, label: s.text };
}

'use strict';
// Six story missions for Rook Calloway, getaway driver of Copperhead County.
// He owes Vera Voss of The Copper Spur casino — every job pays the debt down.
CH.MISSIONS = [
  {
    id: 1, name: 'First Gear', reward: 150,
    brief: [
      'ROOK: Utangku ke Vera Voss sudah $4.000. Satu-satunya jalan keluar: setir.',
      'VERA: Buktikan dulu kau masih bisa nyetir, Rook. Ambil mobil apa saja, bawa ke bengkel cat.',
      'TIPS: Jalan kaki dengan WASD. Tekan E di dekat mobil untuk masuk. E lagi untuk keluar.'
    ],
    steps: [
      { type: 'enterCar', label: 'Masuk ke mobil mana saja' },
      { type: 'goto', x: 1505, y: 1335, r: 90, label: 'Bawa mobil ke Chrome Paint Shop' }
    ]
  },
  {
    id: 2, name: 'Desert Run', reward: 300,
    brief: [
      'VERA: Ada paket di rest area highway barat. Antar ke Desert Rose sebelum matahari terbenam.',
      'ROOK: Highway Copperhead panjang dan panas. Semoga sheriff lagi tidur siang.',
      'TIPS: Ikuti penanda kuning. Kebut di highway, tapi hati-hati menabrak orang.'
    ],
    steps: [
      { type: 'goto', x: 700, y: 2150, r: 110, label: 'Ambil paket di rest area highway barat', needCar: true },
      { type: 'goto', x: 3150, y: 1735, r: 110, label: 'Antar paket ke Desert Rose Casino', needCar: true, timed: 100 }
    ]
  },
  {
    id: 3, name: 'Copper Stash', reward: 250,
    brief: [
      'DUKE (teman lama): Rook, aku sembunyikan tiga kantong tembaga di kota sebelum ditangkap.',
      'DUKE: Satu di junkyard, satu di belakang diner, satu di dekat motel. Ambil semuanya.',
      'TIPS: Turun dari mobil (E), jalan ke penanda, kantong terambil otomatis.'
    ],
    steps: [
      { type: 'collect', x: 250, y: 1850, r: 70, label: 'Ambil stash di Junkyard (1/3)' },
      { type: 'collect', x: 1120, y: 640, r: 70, label: 'Ambil stash di belakang Coyote Diner (2/3)' },
      { type: 'collect', x: 1480, y: 1040, r: 70, label: 'Ambil stash di Copper Rest Motel (3/3)' }
    ]
  },
  {
    id: 4, name: 'Heat Wave', reward: 400,
    brief: [
      'VERA: Sheriff tahu kau yang bawa paket itu. Mereka memasang tiga bintang di kepalamu.',
      'ROOK: Tiga bintang? Aku cuma butuh jalan berdebu dan mobil yang cukup cepat.',
      'TIPS: Hilangkan wanted sampai 0: sembunyi dari patroli, jangan bikin ulah 25 detik.'
    ],
    steps: [
      { type: 'survive', label: 'Lolos dari kejaran sheriff sampai wanted bersih', seconds: 0 }
    ]
  },
  {
    id: 5, name: 'Casino Lights', reward: 500,
    brief: [
      'VERA: Kurirku menunggu di The Copper Spur. Jemput dia, antar ke motel. Jangan sampai mobil rusak.',
      'ROOK: Lampu kasino, uang kasino, masalah kasino. Seperti biasa.',
      'TIPS: Mobilmu harus tetap di atas 30% kondisi saat sampai di motel.'
    ],
    steps: [
      { type: 'goto', x: 2830, y: 1735, r: 100, label: 'Jemput kurir di The Copper Spur', needCar: true },
      { type: 'goto', x: 1520, y: 940, r: 100, label: 'Antar kurir ke Copper Rest Motel — jaga mobilmu', needCar: true, keepHealth: 30 }
    ]
  },
  {
    id: 6, name: 'The Long Haul', reward: 1000,
    brief: [
      'VERA: Kerja terakhir, Rook. Bawa van ungu dari junkyard ke perbatasan county timur.',
      'VERA: Sheriff akan memasang roadblock. Terobos, atau putar lewat gurun. Utangmu lunas kalau sampai.',
      'ROOK: Sekali ini saja, Vera. Setelah ini aku bebas.'
    ],
    steps: [
      { type: 'enterVan', label: 'Naik van ungu di Junkyard' },
      { type: 'goto', x: 3480, y: 2150, r: 110, label: 'Tembus ke perbatasan county timur', needCar: true }
    ]
  }
];

CH.mission = null; // {def, step, timer, marker}
CH.dialog = null;  // {lines, i}

CH.startMission = function (idx) {
  var def = CH.MISSIONS[idx];
  if (!def) { CH.mission = null; return; }
  CH.mission = { def: def, step: 0, timer: 0, idx: idx };
  CH.showDialog(def.brief);
  CH.showMsg('Misi ' + def.id + ': ' + def.name + ' — hadiah ' + CH.fmtMoney(def.reward));
  if (def.id === 4) CH.setWanted(3, 'mission');
  if (def.id === 6) CH.setWanted(4, 'mission');
};

CH.currentStep = function () {
  if (!CH.mission) return null;
  return CH.mission.def.steps[CH.mission.step] || null;
};

CH.missionMarker = function () {
  var s = CH.currentStep();
  if (!s) return null;
  if (s.type === 'goto' || s.type === 'collect') return { x: s.x, y: s.y, label: s.label };
  if (s.type === 'enterVan') return { x: 300, y: 1930, label: s.label };
  return null;
};

CH.completeStep = function () {
  var m = CH.mission;
  if (!m) return;
  m.step++;
  m.timer = 0;
  if (m.step >= m.def.steps.length) CH.completeMission();
  else CH.showMsg('Lanjut: ' + m.def.steps[m.step].label);
};

CH.completeMission = function () {
  var G = CH.G, m = CH.mission;
  if (!m) return;
  G.money += m.def.reward;
  G.missionsDone.push(m.def.id);
  CH.Audio.sfx('mission');
  CH.showMsg('Misi selesai: ' + m.def.name + ' +' + CH.fmtMoney(m.def.reward));
  CH.mission = null;
  CH.setWanted(0, 'mission-done');
  CH.saveGame();
  if (G.missionsDone.length >= CH.MISSIONS.length) {
    G.state = 'ending';
    CH.showEnd('DEBT PAID', 'Enam kerja selesai. Utang Rook ke Vera Voss LUNAS. Copperhead County akhirnya jadi miliknya — setidaknya sampai kerja berikutnya datang.');
    CH.saveGame();
  } else {
    var next = CH.MISSIONS[G.missionsDone.length];
    CH.showDialog(['VERA: Bagus, Rook. Misi berikutnya: ' + next.name + ' (' + CH.fmtMoney(next.reward) + ').',
      'ROOK: Kirim detailnya. Aku sudah di jalan.']);
    setTimeout(function () { CH.startMission(G.missionsDone.length); }, 100);
  }
};

CH.failMission = function (reason) {
  var m = CH.mission;
  if (!m) return;
  CH.showMsg('Misi gagal: ' + reason + '. Coba lagi dari awal misi.');
  CH.mission = null;
  CH.setWanted(0, 'mission-fail');
  setTimeout(function () { CH.startMission(m.idx); }, 800);
};

CH.updateMission = function (dt) {
  var G = CH.G, m = CH.mission;
  if (!m || G.state !== 'playing') return;
  var s = CH.currentStep();
  if (!s) return;
  var p = G.player;
  if (s.type === 'enterCar') {
    if (p.vehicle) CH.completeStep();
  } else if (s.type === 'enterVan') {
    if (p.vehicle && p.vehicle.type === 'van') CH.completeStep();
    else if (p.vehicle) CH.showMsg('Bukan van itu. Cari van ungu di Junkyard.');
  } else if (s.type === 'goto' || s.type === 'collect') {
    if (s.needCar && !p.vehicle) { /* wait */ }
    else if (CH.dist(p.x, p.y, s.x, s.y) < s.r) {
      if (s.type === 'collect') { CH.Audio.sfx('coin'); CH.spawnBurst(s.x, s.y, 12, '#e8a13c'); }
      CH.completeStep();
    }
    if (s.timed) {
      m.timer += dt;
      if (m.timer > s.timed) CH.failMission('waktu habis — paket terlambat');
    }
    if (s.keepHealth && p.vehicle && p.vehicle.health < s.keepHealth) {
      CH.failMission('mobil rusak parah — kurir kabur');
    }
  } else if (s.type === 'survive') {
    if (G.wanted === 0) CH.completeStep();
  }
};

// Dialogue box (story lines). Advance with Enter or a click.
CH.showDialog = function (lines) {
  CH.dialog = { lines: lines, i: 0 };
  var el = document.getElementById('dialog');
  var tx = document.getElementById('dialogText');
  if (el && tx) { tx.textContent = lines[0]; el.style.display = 'block'; }
};

CH.advanceDialog = function () {
  if (!CH.dialog) return;
  CH.dialog.i++;
  var el = document.getElementById('dialog');
  var tx = document.getElementById('dialogText');
  if (CH.dialog.i >= CH.dialog.lines.length) {
    CH.dialog = null;
    if (el) el.style.display = 'none';
  } else if (tx) tx.textContent = CH.dialog.lines[CH.dialog.i];
};

CH.hideDialog = function () {
  CH.dialog = null;
  var el = document.getElementById('dialog');
  if (el) el.style.display = 'none';
};

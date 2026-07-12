// data.js — Songdaten, Akkord-Lehrplan, Impro-Progressionen, Licks
// Foggy Day: transkribiert vom Solo-Arrangement-Scan (piamo/Adobe Scan 5. Juli 2026.pdf),
// Takt 5 („Con moto“) bis Schluss. Original steht in 2/2 — hier 1 Beat = 1 Viertel.
// mel/lh-Format: [beat, dauer, midi] oder [beat, dauer, [midi, ...]] · Akkorde: [symbol, beat, dauer]
// Einzelne Innenstimmen des Scans sind schwer lesbar — Abweichungen bitte melden, hier korrigieren.
'use strict';

// A-Teil (Takt 5–12 der Vorlage), wird für A′ wiederverwendet
const FOGGY_A = () => [
  { chords: [['Fmaj7', 0, 4]],
    mel: [[0, 3, [57, 60, 64]], [3, 1, 72]],
    lh:  [[0, 4, [41, 50]]] },
  { chords: [['Gbdim7', 0, 4]],
    mel: [[0, 1, 66], [1, 2, [69, 72]], [3, 1, 70]],
    lh:  [[0, 4, [42, 54]]] },
  { chords: [['Gm7', 0, 2], ['C13', 2, 2]],
    mel: [[0, 2, [67, 70]], [2, 1, 72], [3, 1, [70, 76]]],
    lh:  [[0, 2, [43, 53]], [2, 2, [48, 58]]] },
  { chords: [['C13b9', 0, 4]],
    mel: [[0, 2, [70, 76]], [2, 2, 73]],
    lh:  [[0, 4, [48, 58]]] },
  { chords: [['F6', 0, 4]],
    mel: [[1, 3, 69]],
    lh:  [[0, 4, [48, 53, 60]]] },
  { chords: [['Ab/F#', 0, 4]],
    mel: [[0, 3, [68, 72]], [3, 1, 75]],
    lh:  [[0, 4, [42, 54]]] },
  { chords: [['G13', 0, 4]],
    mel: [[0, 3, [71, 74, 76]], [3, 1, 72]],
    lh:  [[0, 4, [43, 53]]] },
  { chords: [['C13', 0, 2], ['C9#5', 2, 2]],
    mel: [[0, 2, [70, 76]], [2, 2, [68, 70, 74]]],
    lh:  [[0, 2, [48, 58]], [2, 2, [48, 58]]] },
];

const FOGGY = {
  id: 'foggy',
  title: 'A Foggy Day',
  composer: 'G. Gershwin',
  tempo: 112,
  beatsPerBar: 4,
  bars: [
    // ---- A (Takt 5–12) ----
    ...FOGGY_A(),
    // ---- B (Takt 13–20) — „I viewed the morning with alarm“ ----
    { chords: [['Fmaj7', 0, 4]],
      mel: [[0, 4, [69, 72]], [1, 1, 76], [2, 1, 76], [3, 1, 76]],
      lh:  [[0, 4, [41, 53, 60]]] },
    { chords: [['Cm7b5/Bb', 0, 1.5], ['Cm7b5/A', 1.5, 1.5], ['D7b9', 3, 1]],
      mel: [[0, 1.5, [72, 75]], [1.5, 0.5, [72, 75]], [2, 2, [66, 72, 74]]],
      lh:  [[0, 1.5, 58], [1.5, 1.5, 57], [3, 1, 50]] },
    { chords: [['Bbmaj9', 0, 4]],
      mel: [[1, 1, [69, 72]], [2, 1, [70, 74]], [3, 1, [72, 77]]],
      lh:  [[0, 1, 46], [1, 1, 50], [2, 1, 53], [3, 1, 55]] },
    { chords: [['Eb69', 0, 4]],
      mel: [[0, 4, [67, 70, 72, 77]]],
      lh:  [[0, 4, [39, 51]]] },
    { chords: [['Fmaj7/C', 0, 2], ['Eb69', 2, 1], ['D9', 3, 1]],
      mel: [[0, 2, [69, 72, 76]], [2, 1, [67, 70, 75]], [3, 1, [66, 69, 76]]],
      lh:  [[0, 2, [48, 55]], [2, 1, [51, 58]], [3, 1, [50, 60]]] },
    { chords: [['D9', 0, 4]],
      mel: [[0, 3, [66, 69, 76]], [3, 1, 74]],
      lh:  [[0, 4, [38, 50]]] },
    { chords: [['G69', 0, 1], ['G9#5', 1, 1], ['C9sus4', 2, 2]],
      mel: [[0, 1, [71, 76]], [1, 1, [69, 75]], [2, 2, [70, 74]]],
      lh:  [[0, 1, [43, 47]], [1, 1, [43, 53]], [2, 2, [48, 55]]] },
    { chords: [['C9', 0, 4]],
      mel: [[0, 3, [70, 74]], [3, 1, 72]],
      lh:  [[0, 4, [48, 55, 58]]] },
    // ---- A′ (Takt 21–28) ----
    ...FOGGY_A().slice(0, 7),
    { chords: [['C13', 0, 2], ['C7#5', 2, 2]],
      mel: [[0, 2, [70, 76]], [2, 2, [68, 70, 76]]],
      lh:  [[0, 2, [48, 58]], [2, 2, [48, 58]]] },
    // ---- C (Takt 29–38) — Steigerung und Finale ----
    { chords: [['F13sus4', 0, 2], ['F13b9', 2, 2]],
      mel: [[0, 2, [70, 74, 75]], [2, 2, [66, 74, 75]]],
      lh:  [[0, 2, [41, 51]], [2, 2, [41, 51]]] },
    { chords: [['F13b9', 0, 4]],
      mel: [[0, 3, [66, 74, 75]], [3, 1, 77]],
      lh:  [[0, 4, [41, 51]]] },
    { chords: [['Bbmaj9', 0, 2], ['Gm9b5', 2, 2]],
      mel: [[0, 1, [70, 74]], [1, 1, [72, 75]], [2, 2, [70, 73, 77]]],
      lh:  [[0, 2, [46, 57]], [2, 2, [43, 53]]] },
    { chords: [['Am/C', 0, 2], ['C9', 2, 2]],
      mel: [[0, 2, [64, 69]], [0, 1, 76], [1, 1, 72], [2, 2, [64, 70]], [2, 1, 74], [3, 1, 76]],
      lh:  [[0, 2, [48, 55]], [2, 2, [48, 58]]] },
    { chords: [['Am/C', 0, 2], ['C9', 2, 2]],
      mel: [[0, 2, [64, 69]], [0, 1, 77], [1, 1, 74], [2, 2, [64, 70]], [2, 1, 76], [3, 1, 79]],
      lh:  [[0, 2, [48, 55]], [2, 2, [48, 58]]] },
    { chords: [['Eb9#11', 0, 2], ['G9', 2, 2]],
      mel: [[0, 2, [67, 70, 73, 77]], [2, 2, [71, 74, 77, 79]]],
      lh:  [[0, 2, [39, 51]], [2, 2, [43, 55]]] },
    { chords: [['Gm9', 0, 2], ['C7b9', 2, 2]],
      mel: [[0, 2, [69, 70, 74]], [2, 2, [64, 70, 73]]],
      lh:  [[0, 2, [43, 53]], [2, 2, [36, 46]]] },
    { chords: [['F+6', 0, 4]],
      mel: [[0, 4, [69, 73, 74, 77]]],
      lh:  [[0, 4, [41, 53]]] },
    // Coda (pp, una corda)
    { chords: [['N.C.', 0, 4]],
      mel: [[0, 2, [69, 72, 77]], [2, 2, [67, 71, 76]]],
      lh:  [[0, 2, [48, 55]], [2, 2, [46, 53]]] },
    { chords: [['Fmaj7', 0, 4]],
      mel: [[0, 4, [69, 72, 76, 79]]],
      lh:  [[1, 1, 41], [2, 1, 48], [3, 1, 53]] },
    { chords: [['F13', 0, 4]],
      mel: [[0, 4, [69, 74, 75, 79]]],
      lh:  [[0, 4, [41, 53]]] },
  ],
  phrases: [
    { name: 'A — „A foggy day in London town“',  from: 0,  to: 3 },
    { name: 'A — „…and had me down“',            from: 4,  to: 7 },
    { name: 'B — „I viewed the morning…“',       from: 8,  to: 11 },
    { name: 'B — Rückführung',                   from: 12, to: 15 },
    { name: 'A′ — Reprise',                      from: 16, to: 19 },
    { name: 'A′ — Fortsetzung',                  from: 20, to: 23 },
    { name: 'C — Steigerung (f)',                from: 24, to: 26 },
    { name: 'C — „…shining ev’rywhere“',         from: 27, to: 29 },
    { name: 'Coda (pp, una corda)',              from: 30, to: 34 },
  ],
};

// ---- Cornfield Chase (H. Zimmer, aus „Interstellar“) ----
// Strukturgetreue Umsetzung nach dem EveryonePiano-Blatt (C-Dur, 6/8 mit
// zwei 3/8-Takten): liegende Quinten → Achtel-Ostinato → 16tel-Motor (LH).
// 1 Beat = 1 Achtel. Feinabgleich gegen die Noten wie bei Foggy Day erwünscht.

// LH-16tel-Motor: r – 5 – 8 – 10/♭10 – 8 – 5, zweimal pro 6/8-Takt
function cfEngine(sym, beats = 6) {
  const ch = Theory.parse(sym);
  const r = Theory.fit(ch.root, 41, 52);
  const t3 = r + (ch.intervals.includes(3) ? 3 : 4) + 12;
  const seq = [r, r + 7, r + 12, t3, r + 12, r + 7];
  const out = [];
  for (let b = 0; b < beats; b += 0.5) out.push([b, 0.5, seq[(b * 2) % 6]]);
  return out;
}
// Liegende Quinte (Intro/A-Teil)
function cfPad(sym, beats = 6) {
  const ch = Theory.parse(sym);
  const r = Theory.fit(ch.root, 41, 52);
  return [[0, beats, [r, r + 7]]];
}
// RH-16tel-Figuration eine Oktave höher (A- und C-Teil)
function cfFig(sym, beats = 6) {
  return cfEngine(sym, beats).map(([b, d, n]) => [b, d, n + 12]);
}
// RH-Achtel-Ostinato (Intro): E–A–C aufwärts
const CF_OST = [[0, 1, 64], [1, 1, 69], [2, 1, 72], [3, 1, 64], [4, 1, 69], [5, 1, 72]];

const CORNFIELD = {
  id: 'cornfield',
  title: 'Cornfield Chase',
  composer: 'H. Zimmer',
  tempo: 132,            // 1 Beat = 1 Achtel; Original wirkt ab ~170
  beatsPerBar: 6,
  bars: [
    // Intro (T. 1–5): Quint-Pedal, Ostinato setzt ein
    { chords: [['Am', 0, 6]], mel: [], lh: cfPad('Am') },
    { chords: [['Am', 0, 6]], mel: CF_OST, lh: cfPad('Am') },
    { chords: [['Am', 0, 6]], mel: CF_OST, lh: cfPad('Am') },
    { chords: [['Am', 0, 6]], mel: CF_OST, lh: cfPad('Am') },
    { chords: [['Am', 0, 6]], mel: CF_OST, lh: cfPad('Am') },
    // A-Teil (T. 6–14): Melodie steigt, RH-Figuration, 3/8-Einwürfe
    { chords: [['C', 0, 6]],  mel: [[0, 3, 69], [3, 3, 72], ...cfFig('C')],  lh: cfPad('C') },
    { chords: [['C', 0, 6]],  mel: [[0, 3, 72], [3, 3, 74], ...cfFig('C')],  lh: cfPad('C') },
    { chords: [['F', 0, 6]],  mel: [[0, 3, 74], [3, 3, 72], ...cfFig('F')],  lh: cfPad('F') },
    { chords: [['F', 0, 6]],  mel: [[0, 6, 76], ...cfFig('F')],              lh: cfPad('F') },
    { chords: [['G', 0, 3]],  mel: [[0, 3, 79], ...cfFig('G', 3)],           lh: cfPad('G', 3), beats: 3 },
    { chords: [['G', 0, 3]],  mel: [[0, 3, 77], ...cfFig('G', 3)],           lh: cfPad('G', 3), beats: 3 },
    { chords: [['G', 0, 6]],  mel: [[0, 3, 76], [3, 3, 74], ...cfFig('G')],  lh: cfPad('G') },
    { chords: [['Am', 0, 6]], mel: [[0, 1, 69], [1, 1, 71], [2, 1, 72], [3, 1, 74], [4, 1, 76], [5, 1, 77]], lh: cfPad('Am') },
    { chords: [['G', 0, 6]],  mel: [[0, 1, 79], [1, 1, 77], [2, 1, 76], [3, 1, 74], [4, 1, 71], [5, 1, 67]], lh: cfPad('G') },
    // B-Teil (T. 15–22): Hauptthema (a–h–e-Motiv), LH-Motor läuft an
    { chords: [['Am', 0, 6]], mel: [[0, 2, 69], [2, 1, 71], [3, 3, 76]], lh: cfEngine('Am') },
    { chords: [['Am', 0, 6]], mel: [[0, 2, 69], [2, 1, 71], [3, 3, 74]], lh: cfEngine('Am') },
    { chords: [['F', 0, 6]],  mel: [[0, 2, 69], [2, 1, 71], [3, 3, 72]], lh: cfEngine('F') },
    { chords: [['F', 0, 6]],  mel: [[0, 2, 69], [2, 1, 71], [3, 3, 74]], lh: cfEngine('F') },
    { chords: [['C', 0, 6]],  mel: [[0, 2, 67], [2, 1, 69], [3, 3, 72]], lh: cfEngine('C') },
    { chords: [['C', 0, 6]],  mel: [[0, 2, 64], [2, 1, 67], [3, 3, 71]], lh: cfEngine('C') },
    { chords: [['G', 0, 6]],  mel: [[0, 2, 67], [2, 1, 71], [3, 3, 74]], lh: cfEngine('G') },
    { chords: [['G', 0, 6]],  mel: [[0, 3, 74], [3, 3, 71]],             lh: cfEngine('G') },
    // C-Teil (T. 23–30): Thema oktaviert + RH-Figuration darunter
    { chords: [['Am', 0, 6]], mel: [[0, 2, 81], [2, 1, 83], [3, 3, 88], ...cfFig('Am')], lh: cfEngine('Am') },
    { chords: [['Am', 0, 6]], mel: [[0, 2, 81], [2, 1, 83], [3, 3, 86], ...cfFig('Am')], lh: cfEngine('Am') },
    { chords: [['F', 0, 6]],  mel: [[0, 2, 81], [2, 1, 83], [3, 3, 84], ...cfFig('F')],  lh: cfEngine('F') },
    { chords: [['F', 0, 6]],  mel: [[0, 2, 81], [2, 1, 83], [3, 3, 86], ...cfFig('F')],  lh: cfEngine('F') },
    { chords: [['C', 0, 6]],  mel: [[0, 2, 79], [2, 1, 81], [3, 3, 84], ...cfFig('C')],  lh: cfEngine('C') },
    { chords: [['C', 0, 6]],  mel: [[0, 2, 76], [2, 1, 79], [3, 3, 83], ...cfFig('C')],  lh: cfEngine('C') },
    { chords: [['G', 0, 6]],  mel: [[0, 2, 79], [2, 1, 83], [3, 3, 86], ...cfFig('G')],  lh: cfEngine('G') },
    { chords: [['G', 0, 6]],  mel: [[0, 3, 86], [3, 3, 83], ...cfFig('G')],              lh: cfEngine('G') },
    // Finale (T. 31–35): Abstieg und gebundene Schlussakkorde
    { chords: [['F', 0, 6]],  mel: [[0, 3, 81], [3, 3, 79], ...cfFig('F')], lh: cfEngine('F') },
    { chords: [['G', 0, 6]],  mel: [[0, 3, 77], [3, 3, 74], ...cfFig('G')], lh: cfEngine('G') },
    { chords: [['Am', 0, 6]], mel: [[0, 6, 76], ...cfFig('Am')],            lh: cfEngine('Am') },
    { chords: [['C', 0, 6]],  mel: [[0, 6, [64, 67, 72, 76]]],              lh: [[0, 6, [36, 43, 48]]] },
    { chords: [['C', 0, 6]],  mel: [[0, 6, [64, 67, 72, 76]]],              lh: [[0, 6, [36, 43, 48]]] },
  ],
  phrases: [
    { name: 'Intro — das Pendel setzt ein',    from: 0,  to: 4 },
    { name: 'A — die Melodie steigt',          from: 5,  to: 8 },
    { name: 'A — 3/8-Einwürfe & Lauf',         from: 9,  to: 13 },
    { name: 'B — Hauptthema (a–h–e)',          from: 14, to: 21 },
    { name: 'C — Oktave höher',                from: 22, to: 29 },
    { name: 'Finale',                          from: 30, to: 34 },
  ],
};

const SONGS = [FOGGY, CORNFIELD];

// ---- Akkord-Lehrplan ----
// voicing: 'full' | 'shell' | 'rootlessA' | 'rootlessB' — items können 'notes' (MIDI) direkt setzen
const LESSONS = [
  {
    title: 'Die vier Grundtypen',
    info: 'Fast jeder Jazz-Akkord ist einer von diesen. Greif jeden, hör hin, präg dir den Charakter ein.',
    voicing: 'full',
    items: [
      { sym: 'Cmaj7',  tip: 'Major 7 — warm, ruhig. Das „Zuhause“.' },
      { sym: 'C7',     tip: 'Dominante — will sich auflösen (nach F).' },
      { sym: 'Cm7',    tip: 'Moll 7 — weich, oft der Startpunkt (ii).' },
      { sym: 'Cm7b5',  tip: 'Halbvermindert — der Moll-Wegbereiter.' },
      { sym: 'Cdim7',  tip: 'Vermindert — Durchgang, Spannung pur.' },
    ],
  },
  {
    title: 'Shell-Voicings: 1–3–7',
    info: 'Das Grundgerüst der linken Hand: Grundton, Terz, Septime. Mehr braucht ein Akkord nicht, um jazzig zu klingen.',
    voicing: 'shell',
    items: [
      { sym: 'Fmaj7', tip: 'F + A + E. Lass die Quinte einfach weg.' },
      { sym: 'Gm7',   tip: 'G + Bb + F.' },
      { sym: 'C7',    tip: 'C + E + Bb. Terz+Septime = der ganze Charakter.' },
      { sym: 'Bb7',   tip: 'Bb + D + Ab.' },
      { sym: 'D7',    tip: 'D + F# + C.' },
    ],
  },
  {
    title: 'ii–V–I in F',
    info: 'DIE Jazz-Kadenz. Spiel sie als Shells, bis die Hand sie blind findet: Gm7 → C7 → Fmaj7.',
    voicing: 'shell',
    items: [
      { sym: 'Gm7',   tip: 'ii — der Anlauf.' },
      { sym: 'C7',    tip: 'V — die Spannung. Nur ein Finger bewegt sich: F → E!' },
      { sym: 'Fmaj7', tip: 'I — die Landung. Spür die Auflösung.' },
    ],
  },
  {
    title: 'Farben: 9 und 13',
    info: 'None und Tredezime machen aus Akkorden Jazz. Gleiche Funktion, mehr Schimmer.',
    voicing: 'full',
    items: [
      { sym: 'Cmaj9', tip: 'maj7 + None (D).' },
      { sym: 'C9',    tip: 'Dominante mit None.' },
      { sym: 'C13',   tip: 'Die volle Dominant-Farbe — steht überall im Foggy Day.' },
      { sym: 'Gm9',   tip: 'Moll mit None — samtig.' },
      { sym: 'F69',   tip: 'Sexte + None statt Septime — der klassische Schluss-Klang.' },
    ],
  },
  {
    title: 'Rootless Voicings (Typ A)',
    info: 'Bill-Evans-Stil: Grundton weglassen (den denkt man sich), dafür 3–5–7–9. Kompakt in der Mitte der Tastatur.',
    voicing: 'rootlessA',
    items: [
      { sym: 'Dm7',   tip: 'F–A–C–E: sieht aus wie Fmaj7, ist aber Dm9 ohne Grundton!' },
      { sym: 'G13',   tip: 'F–A–B–E: Terz unten (B), 13 als Farbe.' },
      { sym: 'Cmaj9', tip: 'E–G–B–D. Die Auflösung: nur minimale Bewegung.' },
      { sym: 'Gm7',   tip: 'Bb–D–F–A.' },
      { sym: 'C13',   tip: 'E–A–Bb–D.' },
      { sym: 'Fmaj9', tip: 'A–C–E–G.' },
    ],
  },
  {
    title: 'Rootless Typ B',
    info: 'Dasselbe, aber ab der Septime gestapelt: 7–9–3–5. So bleibst du beim ii–V–I in derselben Lage.',
    voicing: 'rootlessB',
    items: [
      { sym: 'Dm7',   tip: 'C–E–F–A.' },
      { sym: 'G13',   tip: 'F–A–B–E → nur zwei Finger rutschen.' },
      { sym: 'Cmaj9', tip: 'B–D–E–G.' },
    ],
  },
  {
    title: 'ii–V–I durch alle Tonarten',
    info: 'Abfrage: eine zufällige Tonart, du greifst ii–V–I. Erst denken, dann aufdecken.',
    drill: '251',
  },
  {
    title: 'Alterationen: b9, #9, #5',
    info: 'Dominanten darf man reiben lassen. Alterierte Töne wollen sich noch stärker auflösen — perfekt vor Moll oder für Drama.',
    voicing: 'full',
    items: [
      { sym: 'C7b9',  tip: 'Db obendrauf — klassisch vor F-Moll (aber auch vor Dur).' },
      { sym: 'C7#9',  tip: 'Der „Hendrix-Akkord“ — bluesig-aggressiv.' },
      { sym: 'C7#5',  tip: 'Übermäßige Quinte — schwebt. Steht im Foggy Day (C9#5).' },
      { sym: 'C7alt', tip: 'Alles alteriert: b9+#9+#5. Maximale Spannung → Auflösung nach F.' },
      { sym: 'C13b9', tip: '13 UND b9 gleichzeitig — die Gershwin-Farbe aus deinem Stück.' },
    ],
  },
  {
    title: 'Moll ii–V–i',
    info: 'Die Moll-Kadenz: halbvermindert → Dominante mit b9 → Moll. Klingt sofort nach Film noir.',
    voicing: 'full',
    items: [
      { sym: 'Em7b5', tip: 'ii in d-Moll.' },
      { sym: 'A7b9',  tip: 'V — die b9 (Bb) zieht nach A… und nach D.' },
      { sym: 'Dm6',   tip: 'i — Moll mit Sexte klingt jazziger als reines Moll.' },
      { sym: 'Dm(maj7)', tip: 'Alternative: Moll mit großer Septime — James Bond.' },
    ],
  },
  {
    title: 'Sus & Quarten',
    info: 'Moderner Klang: Quarten statt Terzen stapeln. Schwebend, offen — ideal zum lange Vor-sich-hin-Spielen.',
    voicing: 'full',
    items: [
      { sym: 'C9sus4', tip: 'Dominante ohne Terz — löst sich entspannt oder gar nicht auf.' },
      { sym: 'Dm7', notes: [50, 55, 60, 65, 69], tip: '„So What“-Voicing: D–G–C–F + A. Quarten + eine Terz oben.' },
      { sym: 'Ebm7', notes: [51, 56, 61, 66, 70], tip: 'Dasselbe einen Halbton höher — so pendelt „So What“.' },
      { sym: 'G7sus4', tip: 'Auch als F/G denkbar — Grundton + fremder Dreiklang.' },
    ],
  },
  {
    title: 'Die Foggy-Day-Akkorde',
    info: 'Die besonderen Farben aus deinem Arrangement — jetzt kennst du alle Bausteine.',
    voicing: 'full',
    items: [
      { sym: 'Gbdim7',  tip: 'Takt 2: chromatischer Durchgang zwischen F und Gm7.' },
      { sym: 'C13b9',   tip: 'Die aufgeladene Dominante vor F.' },
      { sym: 'G9#5',    tip: 'Schwebende Doppeldominante in der Bridge.' },
      { sym: 'F13sus4', tip: 'Der große Vorhalt am Anfang des Schlussteils.' },
      { sym: 'Eb9#11',  tip: 'Tritonus-Farbe kurz vor dem Finale.' },
      { sym: 'Bb/C',    tip: 'Slash-Akkord: Bb-Dur über C-Bass = eleganter C11.' },
    ],
  },
];

// ---- Impro-Progressionen ----
// bars: 1 Symbol = ganzer Takt, 2 Symbole = halbe/halbe, 3 = 2+1+1
// ii–V–I durch den Quintenzirkel (abwärts): 12 Tonarten à 2 Takte
const CIRCLE_251 = [
  ['C', 'Dm7', 'G7'], ['F', 'Gm7', 'C7'], ['Bb', 'Cm7', 'F7'], ['Eb', 'Fm7', 'Bb7'],
  ['Ab', 'Bbm7', 'Eb7'], ['Db', 'Ebm7', 'Ab7'], ['Gb', 'Abm7', 'Db7'], ['B', 'C#m7', 'F#7'],
  ['E', 'F#m7', 'B7'], ['A', 'Bm7', 'E7'], ['D', 'Em7', 'A7'], ['G', 'Am7', 'D7'],
].flatMap(([key, ii, V]) => [[ii, V], [key + 'maj7']]);

const PROGRESSIONS = [
  {
    id: '251', name: 'ii–V–I', tempo: 110,
    tip: 'Zielton-Übung: lande auf der Terz des nächsten Akkords.',
    bars: [['Gm7'], ['C7'], ['Fmaj7'], ['Fmaj7']],
  },
  {
    id: 'turn', name: 'Turnaround', tempo: 110,
    tip: 'I–VI–ii–V: der ewige Kreisel. Übe kleine Motive, die du jede Runde leicht veränderst.',
    bars: [['Fmaj7', 'D7b9'], ['Gm7', 'C7']],
  },
  {
    id: 'circle', name: 'Quintenzirkel', tempo: 100,
    tip: 'ii–V–I durch alle 12 Tonarten. DIE Übung, um überall zu Hause zu sein — langsam anfangen!',
    bars: CIRCLE_251,
  },
  {
    id: 'blues', name: 'F-Blues', tempo: 120,
    tip: 'Die F-Blues-Skala (F–Ab–Bb–H–C–Eb) funktioniert über ALLE Takte.',
    bars: [['F7'], ['Bb7'], ['F7'], ['Cm7', 'F7'], ['Bb7'], ['Bdim7'], ['F7'], ['Am7b5', 'D7b9'], ['Gm7'], ['C7'], ['F7', 'D7b9'], ['Gm7', 'C7']],
  },
  {
    id: 'mblues', name: 'Moll-Blues', tempo: 104,
    tip: 'Wie „Mr. P.C.“: c-Moll-Pentatonik/Blues-Skala drüber, beim Ab7–G7 die Terzen mitnehmen.',
    bars: [['Cm7'], ['Cm7'], ['Cm7'], ['Cm7'], ['Fm7'], ['Fm7'], ['Cm7'], ['Cm7'], ['Ab7'], ['G7b9'], ['Cm7'], ['Dm7b5', 'G7b9']],
  },
  {
    id: 'm251', name: 'Moll ii–V–i', tempo: 100,
    tip: 'Über A7b9 passt Halbton-Ganzton (A–Bb–C–C#–D#–E–F#–G).',
    bars: [['Em7b5'], ['A7b9'], ['Dm6'], ['Dm6']],
  },
  {
    id: 'leaves', name: 'Autumn Leaves', tempo: 108,
    tip: 'Dur- und Moll-ii–V–I in einem: die ersten 4 Takte sind Bb-Dur, die letzten 4 g-Moll.',
    bars: [['Cm7'], ['F7'], ['Bbmaj7'], ['Ebmaj7'], ['Am7b5'], ['D7b9'], ['Gm6'], ['Gm6']],
  },
  {
    id: 'rhythm', name: 'Rhythm Changes', tempo: 116,
    tip: 'A-Teil von „I Got Rhythm“ — Basis von hunderten Bebop-Stücken. Bb-Dur + Chromatik.',
    bars: [['Bb6', 'G7'], ['Cm7', 'F7'], ['Bb6', 'G7'], ['Cm7', 'F7'], ['Fm7', 'Bb7'], ['Ebmaj7', 'Ebm6'], ['Dm7', 'G7'], ['Cm7', 'F7']],
  },
  {
    id: 'bossa', name: 'Bossa (Moll)', tempo: 116,
    tip: 'Blue-Bossa-Changes: c-Moll, dann Ausflug nach Db-Dur. Ruhig gerade Achtel statt Swing.',
    bars: [['Cm7'], ['Cm7'], ['Fm7'], ['Fm7'], ['Dm7b5'], ['G7b9'], ['Cm7'], ['Cm7'], ['Ebm7'], ['Ab7'], ['Dbmaj7'], ['Dbmaj7'], ['Dm7b5'], ['G7b9'], ['Cm7'], ['Dm7b5', 'G7b9']],
  },
  {
    id: 'tritone', name: 'Chrom. Turnaround', tempo: 96,
    tip: 'Tritonus-Substitution: der Bass läuft chromatisch F–Ab–G–Gb. Über Ab13/Gb13 einfach Halbton über dem Ziel denken.',
    bars: [['Fmaj7', 'Ab13'], ['Gm9', 'Gb13']],
  },
  {
    id: 'modal', name: 'Modal (dorisch)', tempo: 116,
    tip: '„So What“: nur d-dorisch (weiße Tasten ab D). Weniger denken, mehr Rhythmus.',
    bars: [['Dm7'], ['Dm7'], ['Dm7'], ['Dm7'], ['Ebm7'], ['Ebm7'], ['Dm7'], ['Dm7']],
  },
  {
    id: 'foggy', name: 'Foggy Day', tempo: 112,
    tip: 'Improvisiere über die Changes deines Stücks — erst nur Akkordtöne, dann Umspielungen.',
    bars: FOGGY.bars.map(b => b.chords.map(c => c[0])),
  },
];

// ---- Licks ----
// harmony: [beat, akkord] — welcher Akkord ab welchem Schlag drunter liegt.
// Wird für Lick-Analyse (Ton als Gerüst/Verbindung/Würze) und Begleitung gebraucht.
// short: Button-Beschriftung.  8 Schläge = 2 Takte.
const LICKS = [
  // ---- Dur ii–V–I (in F) ----
  {
    name: 'Bebop-Klassiker', short: 'Bebop', ctx: 'Gm7 → C7 → F',
    harmony: [[0, 'Gm7'], [4, 'C7'], [6, 'F']],
    notes: [
      [0, .5, 74], [.5, .5, 72], [1, .5, 70], [1.5, .5, 69], [2, .5, 67], [2.5, .5, 70], [3, .5, 74], [3.5, .5, 77],
      [4, 1, 76], [5, .5, 70], [5.5, .5, 68],
      [6, 2, 69],
    ],
  },
  {
    name: 'Enclosure (Umspielung)', short: 'Umspielung', ctx: 'Gm7 → C7 → F (Ziel: Terz von F)',
    harmony: [[0, 'Gm7'], [4, 'C7'], [6, 'F']],
    notes: [
      [0, .5, 72], [.5, .5, 74], [1, .5, 72], [1.5, .5, 70], [2, .5, 69], [2.5, .5, 67], [3, 1, 65],
      [4, .5, 64], [4.5, .5, 67], [5, .5, 70], [5.5, .5, 73],
      [6, .5, 70], [6.5, .5, 68], [7, 1.5, 69],
    ],
  },
  {
    name: 'Arpeggio 3–9', short: 'Arpeggio', ctx: 'Gm7 → C7 → F',
    harmony: [[0, 'Gm7'], [4, 'C7'], [6, 'F']],
    notes: [
      [0, .5, 70], [.5, .5, 74], [1, .5, 77], [1.5, .5, 81], [2, .5, 79], [2.5, .5, 77], [3, .5, 74], [3.5, .5, 72],
      [4, .5, 76], [4.5, .5, 74], [5, .5, 70], [5.5, .5, 68],
      [6, 2, 69],
    ],
  },
  {
    name: 'Bebop abwärts', short: 'Bebop ↓', ctx: 'Gm7 → C7 → F',
    harmony: [[0, 'Gm7'], [4, 'C7'], [6, 'F']],
    notes: [
      [0, .5, 74], [.5, .5, 72], [1, .5, 70], [1.5, .5, 69], [2, .5, 67], [2.5, .5, 66], [3, .5, 65], [3.5, .5, 64],
      [4, .5, 64], [4.5, .5, 62], [5, .5, 61], [5.5, .5, 60],
      [6, 2, 69],
    ],
  },
  {
    name: 'b9-Linie', short: 'b9-Linie', ctx: 'Gm7 → C7 → F (Spannung auf C7)',
    harmony: [[0, 'Gm7'], [4, 'C7'], [6, 'F']],
    notes: [
      [0, .5, 67], [.5, .5, 70], [1, .5, 74], [1.5, .5, 77], [2, 1, 74], [3, 1, 72],
      [4, .5, 76], [4.5, .5, 73], [5, .5, 72], [5.5, .5, 70],
      [6, 2, 69],
    ],
  },
  {
    name: 'Kurve', short: 'Kurve', ctx: 'Gm7 → C7 → F',
    harmony: [[0, 'Gm7'], [4, 'C7'], [6, 'F']],
    notes: [
      [0, .5, 70], [.5, .5, 72], [1, .5, 74], [1.5, .5, 72], [2, .5, 70], [2.5, .5, 69], [3, 1, 67],
      [4, .5, 64], [4.5, .5, 67], [5, .5, 70], [5.5, .5, 73],
      [6, 2, 69],
    ],
  },
  // ---- Moll ii–V–i (in Dm) ----
  {
    name: 'Moll-Linie abwärts', short: 'Moll 1', ctx: 'Em7♭5 → A7♭9 → Dm',
    harmony: [[0, 'Em7b5'], [4, 'A7b9'], [6, 'Dm6']],
    notes: [
      [0, .5, 74], [.5, .5, 70], [1, .5, 67], [1.5, .5, 65], [2, .5, 64], [2.5, .5, 62], [3, 1, 60],
      [4, .5, 61], [4.5, .5, 64], [5, .5, 67], [5.5, .5, 70],
      [6, 2, 65],
    ],
  },
  {
    name: 'Moll-Arpeggio', short: 'Moll 2', ctx: 'Em7♭5 → A7♭9 → Dm',
    harmony: [[0, 'Em7b5'], [4, 'A7b9'], [6, 'Dm6']],
    notes: [
      [0, .5, 64], [.5, .5, 67], [1, .5, 70], [1.5, .5, 74], [2, .5, 70], [2.5, .5, 67], [3, 1, 65],
      [4, .5, 64], [4.5, .5, 67], [5, .5, 70], [5.5, .5, 72],
      [6, 2, 69],
    ],
  },
  // ---- Blues (F7) ----
  {
    name: 'Blues Ruf & Antwort', short: 'Blues 2', ctx: 'über F7 & Blues',
    harmony: [[0, 'F7']],
    notes: [
      [0, .5, 72], [.5, .5, 75], [1, .5, 72], [1.5, .5, 70], [2, 1, 68], [3, 1, 65],
      [4, .5, 65], [4.5, .5, 68], [5, .5, 70], [5.5, .5, 71], [6, .5, 72], [6.5, 1.5, 65],
    ],
  },
  // ---- Alteriert / Turnaround / Modal ----
  {
    name: 'Alterierte Linie', short: 'Alteriert', ctx: 'C7alt → F',
    harmony: [[0, 'C7alt'], [4, 'F']],
    notes: [
      [0, .5, 75], [.5, .5, 73], [1, .5, 72], [1.5, .5, 70], [2, .5, 68], [2.5, .5, 66], [3, .5, 64], [3.5, .5, 63],
      [4, .5, 65], [4.5, .5, 69], [5, .5, 72], [5.5, .5, 76],
      [6, 2, 69],
    ],
  },
  {
    name: 'Turnaround-Linie', short: 'Turnaround', ctx: 'F → D7♭9 → Gm7 → C7',
    harmony: [[0, 'F6'], [2, 'D7b9'], [4, 'Gm7'], [6, 'C7']],
    notes: [
      [0, .5, 69], [.5, .5, 72], [1, .5, 74], [1.5, .5, 72],
      [2, .5, 66], [2.5, .5, 69], [3, .5, 72], [3.5, .5, 75],
      [4, .5, 74], [4.5, .5, 70], [5, .5, 67], [5.5, .5, 70],
      [6, .5, 64], [6.5, .5, 67], [7, 1, 70],
    ],
  },
  {
    name: 'Dorisch modal', short: 'Dorisch', ctx: 'über Dm7 (natürliche Sexte!)',
    harmony: [[0, 'Dm7']],
    notes: [
      [0, .5, 62], [.5, .5, 65], [1, .5, 69], [1.5, .5, 72], [2, .5, 74], [2.5, .5, 72], [3, .5, 69], [3.5, .5, 71],
      [4, .5, 72], [4.5, .5, 69], [5, .5, 67], [5.5, .5, 65],
      [6, 2, 62],
    ],
  },
  {
    name: 'Quarten-Lick (modern)', short: 'Quarten', ctx: 'über Gm7 / modal',
    harmony: [[0, 'Gm7']],
    notes: [
      [0, .5, 67], [.5, .5, 72], [1, .5, 77], [1.5, .5, 74], [2, .5, 79], [2.5, .5, 77], [3, .5, 74], [3.5, .5, 72],
      [4, 1, 70], [5, .5, 67], [5.5, .5, 65],
      [6, 2, 62],
    ],
  },
];

// theory.js — Akkord-Parser, Voicings, Skalen
'use strict';

const Theory = (() => {

  const NOTE_INDEX = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'Fb': 4,
    'E#': 5, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
    'A#': 10, 'Bb': 10, 'B': 11, 'Cb': 11, 'B#': 0
  };

  const NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  function noteName(midi, flat = true) {
    return (flat ? NAMES_FLAT : NAMES_SHARP)[((midi % 12) + 12) % 12];
  }

  // Intervalle in Halbtönen ab Grundton. Reihenfolge: längere Suffixe zuerst prüfen.
  const QUALITIES = [
    ['maj13',   [0, 4, 7, 11, 14, 21], 'maj'],
    ['maj9#11', [0, 4, 7, 11, 14, 18], 'lyd'],
    ['maj7#11', [0, 4, 7, 11, 18],     'lyd'],
    ['maj9',    [0, 4, 7, 11, 14],     'maj'],
    ['maj7',    [0, 4, 7, 11],         'maj'],
    ['m11',     [0, 3, 7, 10, 14, 17], 'min'],
    ['m9b5',    [0, 3, 6, 10, 14],     'halfdim'],
    ['m7b5',    [0, 3, 6, 10],         'halfdim'],
    ['mb5',     [0, 3, 6],             'halfdim'],
    ['m(maj7)', [0, 3, 7, 11],         'melmin'],
    ['m69',     [0, 3, 7, 9, 14],      'min'],
    ['m9',      [0, 3, 7, 10, 14],     'min'],
    ['m7',      [0, 3, 7, 10],         'min'],
    ['m6',      [0, 3, 7, 9],          'min'],
    ['m',       [0, 3, 7],             'min'],
    ['dim7',    [0, 3, 6, 9],          'dim'],
    ['dim',     [0, 3, 6],             'dim'],
    ['13sus4',  [0, 5, 7, 10, 14, 21], 'sus'],
    ['9sus4',   [0, 5, 7, 10, 14],     'sus'],
    ['7sus4',   [0, 5, 7, 10],         'sus'],
    ['sus4',    [0, 5, 7],             'sus'],
    ['sus2',    [0, 2, 7],             'sus'],
    ['13b9',    [0, 4, 10, 13, 21],    'domdim'],
    ['13#11',   [0, 4, 10, 14, 18, 21],'lyddom'],
    ['13',      [0, 4, 7, 10, 14, 21], 'dom'],
    ['11',      [0, 7, 10, 14, 17],    'sus'],
    ['9#11',    [0, 4, 7, 10, 14, 18], 'lyddom'],
    ['9#5',     [0, 4, 8, 10, 14],     'alt'],
    ['9b5',     [0, 4, 6, 10, 14],     'lyddom'],
    ['9',       [0, 4, 7, 10, 14],     'dom'],
    ['7b13',    [0, 4, 10, 14, 20],    'alt'],
    ['7#9#5',   [0, 4, 8, 10, 15],     'alt'],
    ['7b9b5',   [0, 4, 6, 10, 13],     'alt'],
    ['7b9#5',   [0, 4, 8, 10, 13],     'alt'],
    ['7#9',     [0, 4, 7, 10, 15],     'alt'],
    ['7b9',     [0, 4, 7, 10, 13],     'domdim'],
    ['7#11',    [0, 4, 7, 10, 18],     'lyddom'],
    ['7#5',     [0, 4, 8, 10],         'alt'],
    ['7b5',     [0, 4, 6, 10],         'alt'],
    ['7alt',    [0, 4, 8, 10, 13, 15], 'alt'],
    ['alt',     [0, 4, 8, 10, 13, 15], 'alt'],
    ['7',       [0, 4, 7, 10],         'dom'],
    ['69',      [0, 4, 7, 9, 14],      'maj'],
    ['6',       [0, 4, 7, 9],          'maj'],
    ['+7',      [0, 4, 8, 10],         'alt'],
    ['+6',      [0, 4, 8, 9],          'maj'],
    ['+',       [0, 4, 8],             'alt'],
    ['aug',     [0, 4, 8],             'alt'],
    ['5',       [0, 7],                'maj'],
    ['',        [0, 4, 7],             'maj'],
  ];

  const SCALES = {
    maj:     [0, 2, 4, 5, 7, 9, 11],       // Ionisch
    lyd:     [0, 2, 4, 6, 7, 9, 11],       // Lydisch
    min:     [0, 2, 3, 5, 7, 9, 10],       // Dorisch
    dom:     [0, 2, 4, 5, 7, 9, 10],       // Mixolydisch
    lyddom:  [0, 2, 4, 6, 7, 9, 10],       // Mixo #11
    sus:     [0, 2, 4, 5, 7, 9, 10],       // Mixolydisch
    halfdim: [0, 2, 3, 5, 6, 8, 10],       // Lokrisch (mit 9)
    dim:     [0, 2, 3, 5, 6, 8, 9, 11],    // GT-HT
    domdim:  [0, 1, 3, 4, 6, 7, 9, 10],    // HT-GT
    alt:     [0, 1, 3, 4, 6, 8, 10],       // Alteriert
    melmin:  [0, 2, 3, 5, 7, 9, 11],       // Melodisch Moll
  };

  // "C9sus4" → {root:0, rootName:'C', quality:'9sus4', intervals:[...], bass:null, scaleType:'sus'}
  function parse(symbol) {
    if (!symbol || symbol === 'N.C.') return null;
    let s = symbol.trim()
      .replace(/Δ/g, 'maj7').replace(/°/g, 'dim').replace(/ø/g, 'm7b5')
      .replace(/6\/9/g, '69').replace(/[()]/g, '').replace(/-/g, 'm')
      .replace(/min/gi, 'm').replace(/H(?=[b#\d]|$)/, 'B');

    let bass = null;
    const slash = s.match(/\/([A-G][b#]?)$/);
    if (slash) { bass = NOTE_INDEX[slash[1]]; s = s.slice(0, slash.index); }

    const rm = s.match(/^([A-G][b#]?)/);
    if (!rm) return null;
    const rootName = rm[1];
    const root = NOTE_INDEX[rootName];
    let rest = s.slice(rootName.length);
    if (/^maj$/i.test(rest)) rest = '';
    if (/^M7/.test(rest)) rest = 'maj7' + rest.slice(2);

    let q = QUALITIES.find(([suffix]) => suffix !== '' && rest === suffix);
    if (!q) q = QUALITIES.find(([suffix]) => suffix !== '' && rest.startsWith(suffix));
    if (!q) q = QUALITIES[QUALITIES.length - 1];

    return {
      symbol, root, rootName, bass,
      quality: q[0], intervals: q[1], scaleType: q[2],
      tones: q[1].map(i => (root + i) % 12),
      scale: SCALES[q[2]].map(i => (root + i) % 12),
    };
  }

  // Ton in den MIDI-Bereich [lo, hi] legen (nächstgelegene Oktave)
  function fit(pc, lo, hi) {
    let n = lo + ((pc - lo) % 12 + 12) % 12;
    if (n > hi) n -= 12;
    return n;
  }

  // ---- Voicings (MIDI-Noten) ----

  // Shell: Grundton tief + Terz & Septime (bzw. Sexte) kompakt darüber
  function shellVoicing(ch) {
    if (!ch) return [];
    const root = fit((ch.bass != null ? ch.bass : ch.root), 40, 51); // E2..Eb3
    const iv = ch.intervals;
    const third = iv.find(i => i === 3 || i === 4) ?? iv.find(i => i === 5 || i === 2);
    const seventh = iv.find(i => i === 10 || i === 11) ?? iv.find(i => i === 9) ?? 7;
    const notes = [root];
    if (third != null) notes.push(fit((ch.root + third) % 12, 52, 63));
    notes.push(fit((ch.root + seventh) % 12, 52, 63));
    return [...new Set(notes)].sort((a, b) => a - b);
  }

  // Rootless (Bill-Evans-Stil), Typ A: ab Terz, Typ B: ab Septime
  function rootlessVoicing(ch, type = 'A') {
    if (!ch) return [];
    const iv = ch.intervals;
    const has = x => iv.includes(x);
    const third = has(3) ? 3 : has(4) ? 4 : has(5) ? 5 : 4;
    const seventh = has(10) ? 10 : has(11) ? 11 : has(9) ? 9 : 10;
    const fifth = iv.find(i => i === 6 || i === 7 || i === 8) ?? 7;
    const ninth = iv.find(i => i === 13 || i === 14 || i === 15) ?? 14;
    const color = has(21) ? 21 : (ch.scaleType === 'dom' || ch.scaleType === 'lyddom' || ch.scaleType === 'alt' || ch.scaleType === 'domdim') ? 21 : fifth;
    const stack = type === 'A' ? [third, color === 21 ? 21 : fifth, seventh, ninth]
                               : [seventh, ninth, third + 12, color === 21 ? 21 + 12 : fifth + 12];
    const pcs = stack.map(i => (ch.root + i) % 12);
    const notes = [];
    let prev = type === 'A' ? 52 : 50; // um C3/D3 beginnen
    for (const pc of pcs) {
      let n = fit(pc, prev, prev + 11);
      if (n <= prev && notes.length) n += 12;
      notes.push(n); prev = n;
    }
    return [...new Set(notes)].sort((a, b) => a - b);
  }

  // Volles Voicing zum Anzeigen/Vorspielen: Grundton + alle Akkordtöne kompakt ab C3
  function fullVoicing(ch, base = 48) {
    if (!ch) return [];
    const notes = [fit((ch.bass != null ? ch.bass : ch.root), 36, 47)];
    let prev = base - 1;
    for (const i of ch.intervals) {
      if (i === 0 && ch.bass == null) continue;
      let n = base + ((ch.root + i) % 12 - base % 12 + 12) % 12;
      while (n <= prev) n += 12;
      notes.push(n); prev = n;
    }
    return [...new Set(notes)].sort((a, b) => a - b);
  }

  function bassNote(ch) {
    if (!ch) return null;
    return fit((ch.bass != null ? ch.bass : ch.root), 33, 44); // A1..Ab2
  }

  return { parse, noteName, fit, shellVoicing, rootlessVoicing, fullVoicing, bassNote, SCALES };
})();

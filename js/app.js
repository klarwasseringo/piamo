// app.js — Modi, Playback, UI
'use strict';

// ---------- Playback-Engine ----------
class Player {
  constructor(keyboard) {
    this.kbd = keyboard;
    this.timer = null;
    this.timeouts = new Set();
    this.playing = false;
  }

  // events: {t, dur, midi, cls, sound:'piano'|'bass'|'tick', vel}
  play(events, { tempo = 100, loopBeats = null, countIn = 0, onBeat = null, onEnd = null } = {}) {
    this.stop();
    Sound.ensure();
    this.playing = true;
    const spb = 60 / tempo;
    this.spb = spb;
    this.events = events.slice().sort((a, b) => a.t - b.t);
    this.loopBeats = loopBeats;
    this.onBeat = onBeat;
    this.onEnd = onEnd;
    const now = Sound.now() + 0.12;
    for (let i = 0; i < countIn; i++) Sound.tick(now + i * spb, i === 0);
    this.start = now + countIn * spb;
    this.cycle = 0;
    this.idx = 0;
    this.lastBeat = -1;
    this.endBeat = this.events.reduce((m, e) => Math.max(m, e.t + (e.dur || 0)), 0);
    this.timer = setInterval(() => this._pump(), 25);
    this._pump();
  }

  _pump() {
    if (!this.playing) return;
    const now = Sound.now(), horizon = now + 0.15;

    if (this.onBeat) {
      const abs = Math.floor((now - this.start) / this.spb);
      if (abs > this.lastBeat && abs >= 0) {
        this.lastBeat = abs;
        const span = this.loopBeats || (this.endBeat || 1);
        this.onBeat(abs % span, abs);
      }
    }

    let guard = 0;
    while (guard++ < 500) {
      if (this.idx >= this.events.length) {
        if (this.loopBeats != null) { this.cycle++; this.idx = 0; }
        else break;
      }
      const ev = this.events[this.idx];
      const base = this.start + this.cycle * (this.loopBeats || 0) * this.spb;
      const when = base + ev.t * this.spb;
      if (when >= horizon) break;
      this.idx++;
      this._fire(ev, when);
    }

    if (this.loopBeats == null && this.idx >= this.events.length) {
      if (Sound.now() > this.start + this.endBeat * this.spb + 0.25) {
        this.stop();
        if (this.onEnd) this.onEnd();
      }
    }
  }

  _fire(ev, when) {
    const durS = (ev.dur || 0.5) * this.spb;
    if (ev.sound === 'tick') Sound.tick(when, ev.accent);
    else if (ev.sound === 'bass') Sound.bass(ev.midi, when, durS, ev.vel || 0.7);
    else if (ev.midi != null) Sound.piano(ev.midi, when, durS, ev.vel || 0.8);
    if (ev.midi != null && ev.cls) {
      const delay = Math.max(0, (when - Sound.now()) * 1000);
      const id = setTimeout(() => {
        this.timeouts.delete(id);
        this.kbd.flash(ev.midi, ev.cls, Math.max(durS * 1000 - 40, 90));
      }, delay);
      this.timeouts.add(id);
    }
  }

  // Live-Tempowechsel: aktuelle Beat-Position bleibt erhalten
  setTempo(bpm) {
    if (!this.playing) return;
    const now = Sound.now();
    const absBeat = (now - this.start) / this.spb;
    this.spb = 60 / bpm;
    this.start = now - absBeat * this.spb;
  }

  stop() {
    this.playing = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.timeouts.forEach(clearTimeout);
    this.timeouts.clear();
  }
}

// ---------- App ----------
const App = (() => {
  const $ = sel => document.querySelector(sel);
  const stage = () => $('#stage');
  let kbd, player;

  const state = Object.assign(
    { mode: 'song', phrase: 0, hands: 'both', songTempo: 90, songLoop: true,
      lesson: 0, item: 0, prog: '251', improTempo: null,
      improShow: { root: true, chord: true, scale: false }, improAnalyze: false,
      transpose: 0 },
    JSON.parse(localStorage.getItem('piamo') || '{}')
  );
  const save = () => localStorage.setItem('piamo', JSON.stringify(state));

  function fmtChord(sym) {
    return sym.replace(/b(?=[0-9])/g, '♭').replace(/#(?=[0-9])/g, '♯')
              .replace(/([A-G])b/g, '$1♭').replace(/([A-G])#/g, '$1♯');
  }

  // ---------- Song-Modus ----------
  // mel/lh-Einträge: [beat, dauer, midi] oder [beat, dauer, [midi, midi, ...]]
  function pushVoice(evs, beat, entries, cls, vel) {
    for (const [b, d, n] of entries) {
      const notes = Array.isArray(n) ? n : [n];
      for (const m of notes) evs.push({ t: beat + b, dur: d, midi: m, cls, sound: 'piano', vel });
    }
  }

  function songEvents(from, to, hands) {
    const evs = [];
    let beat = 0;
    for (let i = from; i <= to; i++) {
      const bar = FOGGY.bars[i];
      if (hands !== 'lh') pushVoice(evs, beat, bar.mel, 'rh', 0.85);
      if (hands !== 'rh') {
        if (bar.lh) pushVoice(evs, beat, bar.lh, 'lh', 0.5);
        else for (const [sym, b, d] of bar.chords) {
          const v = Theory.shellVoicing(Theory.parse(sym));
          v.forEach(n => evs.push({ t: beat + b, dur: d, midi: n, cls: 'lh', sound: 'piano', vel: 0.45 }));
        }
      }
      beat += 4;
    }
    return { evs, beats: beat };
  }

  function chordAtBeat(from, beat) {
    const barIdx = from + Math.floor(beat / 4);
    const bar = FOGGY.bars[barIdx];
    if (!bar) return '';
    const inBar = beat % 4;
    let cur = bar.chords[0][0];
    for (const [sym, b] of bar.chords) if (b <= inBar) cur = sym;
    return cur;
  }

  function renderSong() {
    const ph = FOGGY.phrases[state.phrase];
    stage().innerHTML = `
      <div class="phrase-nav">
        <button class="navbtn" id="phPrev">‹</button>
        <div class="phrase-title">
          <div class="phrase-name">${ph.name}</div>
          <div class="dots">${FOGGY.phrases.map((_, i) =>
            `<span class="dot${i === state.phrase ? ' on' : ''}" data-i="${i}"></span>`).join('')}</div>
        </div>
        <button class="navbtn" id="phNext">›</button>
      </div>
      <div class="bigchord" id="songChord">&nbsp;</div>
      <div class="controls">
        <button class="playbtn" id="songPlay">▶</button>
        <button class="tog${state.songLoop ? ' on' : ''}" id="songLoop">⟳</button>
        <div class="seg">
          <button class="segbtn${state.hands === 'rh' ? ' on' : ''}" data-h="rh">RH</button>
          <button class="segbtn${state.hands === 'lh' ? ' on' : ''}" data-h="lh">LH</button>
          <button class="segbtn${state.hands === 'both' ? ' on' : ''}" data-h="both">Beide</button>
        </div>
        <label class="tempo">♩=<span id="songBpm">${state.songTempo}</span>
          <input type="range" id="songTempo" min="50" max="180" value="${state.songTempo}">
        </label>
      </div>`;

    const fitPhrase = () => {
      const { evs } = songEvents(ph.from, ph.to, state.hands);
      kbd.fitTo(evs.filter(e => e.midi).map(e => e.midi));
      kbd.clear();
    };
    fitPhrase();

    const setPhrase = i => {
      player.stop(); resetPlayBtn();
      state.phrase = (i + FOGGY.phrases.length) % FOGGY.phrases.length;
      save(); renderSong();
    };
    $('#phPrev').onclick = () => setPhrase(state.phrase - 1);
    $('#phNext').onclick = () => setPhrase(state.phrase + 1);
    stage().querySelectorAll('.dot').forEach(d => d.onclick = () => setPhrase(+d.dataset.i));

    const resetPlayBtn = () => { const b = $('#songPlay'); if (b) b.textContent = '▶'; };
    $('#songPlay').onclick = () => {
      if (player.playing) { player.stop(); resetPlayBtn(); $('#songChord').innerHTML = '&nbsp;'; return; }
      const cur = FOGGY.phrases[state.phrase];
      const { evs, beats } = songEvents(cur.from, cur.to, state.hands);
      $('#songPlay').textContent = '■';
      player.play(evs, {
        tempo: state.songTempo,
        loopBeats: state.songLoop ? beats : null,
        countIn: 4,
        onBeat: b => { const el = $('#songChord'); if (el) el.textContent = fmtChord(chordAtBeat(cur.from, b)); },
        onEnd: () => { resetPlayBtn(); },
      });
    };
    $('#songLoop').onclick = e => { state.songLoop = !state.songLoop; save(); e.target.classList.toggle('on', state.songLoop); };
    stage().querySelectorAll('.segbtn').forEach(b => b.onclick = () => {
      state.hands = b.dataset.h; save();
      player.stop(); resetPlayBtn(); renderSong();
    });
    $('#songTempo').oninput = e => {
      state.songTempo = +e.target.value; $('#songBpm').textContent = e.target.value; save();
      player.setTempo(state.songTempo);
    };
  }

  // ---------- Akkord-Modus ----------
  const KEYS_251 = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'G', 'D', 'A', 'E', 'B', 'Gb'];
  let drill = null;

  // Akkordsymbol um n Halbtöne verschieben (inkl. Slash-Bass)
  function transposeSym(sym, off) {
    if (!off) return sym;
    const ch = Theory.parse(sym);
    if (!ch) return sym;
    let s = Theory.noteName((ch.root + off + 12) % 12) + ch.quality;
    if (ch.bass != null) s += '/' + Theory.noteName((ch.bass + off + 12) % 12);
    return s;
  }

  function voicingFor(lesson, item, off = 0) {
    if (item.notes) return item.notes.map(n => n + off);
    const ch = Theory.parse(transposeSym(item.sym, off));
    if (lesson.voicing === 'shell') return Theory.shellVoicing(ch);
    if (lesson.voicing === 'rootlessA') return Theory.rootlessVoicing(ch, 'A');
    if (lesson.voicing === 'rootlessB') return Theory.rootlessVoicing(ch, 'B');
    return Theory.fullVoicing(ch);
  }

  // Töne eines Voicings als Notennamen (tief→hoch, ohne Oktav-Dubletten)
  function spellNotes(notes) {
    const seen = new Set(), out = [];
    for (const n of notes) { const nm = Theory.noteName(n); if (!seen.has(nm)) { seen.add(nm); out.push(nm); } }
    return out.join(' – ').replace(/b/g, '♭');
  }

  const keyName = off => fmtChord(Theory.noteName(((off % 12) + 12) % 12));

  function playChordNotes(notes, roll = 0.035) {
    Sound.ensure();
    const t = Sound.now() + 0.05;
    notes.forEach((n, i) => Sound.piano(n, t + i * roll, 1.8, 0.7));
  }

  function showChordCard(notes) {
    kbd.fitTo(notes);
    kbd.clear();
    kbd.lightNotes(notes, 'lh');
    playChordNotes(notes);
  }

  function renderChords() {
    const lesson = LESSONS[state.lesson];

    if (lesson.drill === '251') { renderDrill(lesson); return; }
    if (state.item >= lesson.items.length) state.item = 0;
    const off = state.transpose;
    const item = lesson.items[state.item];
    const notes = voicingFor(lesson, item, off);
    // Bei Transponierung ist der handgeschriebene Tipp (mit festen Notennamen) nicht
    // mehr korrekt — dann zeigen wir stattdessen die konkreten Griff-Töne der neuen Tonart.
    const tipText = off ? '🎹 ' + spellNotes(notes) : (item.tip || '');

    stage().innerHTML = `
      <div class="lesson-head">
        <button class="navbtn sm" id="lsPrev">‹</button>
        <div class="lesson-title">Lektion ${state.lesson + 1}/${LESSONS.length} · ${lesson.title}${off ? ' · in ' + keyName(off) : ''}</div>
        <button class="navbtn sm" id="lsNext">›</button>
      </div>
      <div class="lesson-info">${lesson.info}</div>
      <div class="bigchord">${fmtChord(transposeSym(item.sym, off))}</div>
      <div class="tip">${tipText}</div>
      <div class="controls">
        <button class="playbtn" id="chHear">▶</button>
        <div class="counter">${state.item + 1}/${lesson.items.length}</div>
        <button class="nextbtn" id="chNext">Weiter →</button>
      </div>
      <div class="controls sub">
        <button class="nextbtn" id="chAll">Alle anhören ▶</button>
        <button class="nextbtn alt" id="chKey">Tonart 🔀</button>
        ${off ? '<button class="nextbtn alt" id="chReset">↺ C</button>' : ''}
      </div>`;

    showChordCard(notes);
    $('#chHear').onclick = () => playChordNotes(notes);
    $('#chNext').onclick = () => {
      state.item++;
      if (state.item >= lesson.items.length) { state.item = 0; state.lesson = (state.lesson + 1) % LESSONS.length; }
      save(); renderChords();
    };
    $('#lsPrev').onclick = () => { state.lesson = (state.lesson - 1 + LESSONS.length) % LESSONS.length; state.item = 0; save(); renderChords(); };
    $('#lsNext').onclick = () => { state.lesson = (state.lesson + 1) % LESSONS.length; state.item = 0; save(); renderChords(); };

    // Alle Akkorde der Lektion nacheinander vorspielen (in aktueller Tonart)
    $('#chAll').onclick = () => {
      const all = lesson.items.map(it => voicingFor(lesson, it, off));
      kbd.fitTo(all.flat());
      const bc = stage().querySelector('.bigchord');
      const t0 = Sound.now() + 0.05, step = 0.95;
      all.forEach((v, i) => {
        v.forEach(n => Sound.piano(n, t0 + i * step, step * 0.95, 0.7));
        const at = Math.max(0, (t0 - Sound.now() + i * step) * 1000);
        setTimeout(() => {
          kbd.clear(); kbd.lightNotes(v, 'lh');
          if (bc) bc.textContent = fmtChord(transposeSym(lesson.items[i].sym, off));
        }, at);
      });
      // am Ende auf den aktuellen Akkord zurück
      setTimeout(() => {
        kbd.clear(); kbd.lightNotes(notes, 'lh');
        if (bc) bc.textContent = fmtChord(transposeSym(item.sym, off));
      }, (all.length + 0.3) * step * 1000);
    };

    $('#chKey').onclick = () => {
      let n = off;
      while (n === off) n = 1 + Math.floor(Math.random() * 11); // 1..11, nie gleich
      state.transpose = n; save(); renderChords();
    };
    const reset = $('#chReset');
    if (reset) reset.onclick = () => { state.transpose = 0; save(); renderChords(); };
  }

  function renderDrill(lesson) {
    if (!drill) {
      const key = KEYS_251[Math.floor(Math.random() * KEYS_251.length)];
      drill = { key, step: -1 };
    }
    const root = drill.key;
    const ch = Theory.parse(root);
    const names = ['ii', 'V', 'I'];
    const syms = [
      Theory.noteName(ch.root + 2) + 'm7',
      Theory.noteName(ch.root + 7) + '7',
      root + 'maj7',
    ];
    const revealed = drill.step >= 0 ? `${names[drill.step]} = ${fmtChord(syms[drill.step])}` : 'Erst greifen, dann aufdecken!';

    stage().innerHTML = `
      <div class="lesson-head">
        <button class="navbtn sm" id="lsPrev">‹</button>
        <div class="lesson-title">Lektion ${state.lesson + 1}/${LESSONS.length} · ${lesson.title}</div>
        <button class="navbtn sm" id="lsNext">›</button>
      </div>
      <div class="lesson-info">${lesson.info}</div>
      <div class="bigchord">ii–V–I in ${fmtChord(root)}</div>
      <div class="tip">${revealed}</div>
      <div class="controls">
        <button class="nextbtn" id="drReveal">${drill.step < 2 ? 'Aufdecken: ' + names[drill.step + 1] : 'Alle anhören ▶'}</button>
        <button class="nextbtn alt" id="drNew">Neue Tonart 🔀</button>
      </div>`;

    $('#drReveal').onclick = () => {
      if (drill.step < 2) {
        drill.step++;
        renderDrill(lesson);
        const notes = Theory.shellVoicing(Theory.parse(syms[drill.step]));
        showChordCard(notes);
      } else {
        kbd.clear();
        const t0 = Sound.now() + 0.05;
        syms.forEach((s, i) => {
          const notes = Theory.shellVoicing(Theory.parse(s));
          notes.forEach(n => Sound.piano(n, t0 + i * 1.0, 0.95, 0.7));
          setTimeout(() => { kbd.clear(); kbd.lightNotes(notes, 'lh'); }, (t0 - Sound.now() + i * 1.0) * 1000);
        });
      }
    };
    $('#drNew').onclick = () => { drill = null; kbd.clear(); renderDrill(lesson); };
    $('#lsPrev').onclick = () => { drill = null; state.lesson = (state.lesson - 1 + LESSONS.length) % LESSONS.length; state.item = 0; save(); renderChords(); };
    $('#lsNext').onclick = () => { drill = null; state.lesson = (state.lesson + 1) % LESSONS.length; state.item = 0; save(); renderChords(); };
    if (drill.step === -1) { kbd.setRange(36, 84); kbd.clear(); }
  }

  // ---------- Impro-Modus ----------
  function improEvents(prog) {
    const evs = [];
    prog.bars.forEach((chords, barIdx) => {
      const t = barIdx * 4;
      // 1 Akkord = ganzer Takt, 2 = halbe/halbe, 3 = 2+1+1 Schläge
      const grid = { 1: [[0, 4]], 2: [[0, 2], [2, 2]], 3: [[0, 2], [2, 1], [3, 1]] }[Math.min(chords.length, 3)];
      const segs = chords.slice(0, 3).map((sym, i) => ({ sym, start: grid[i][0], dur: grid[i][1] }));
      for (const seg of segs) {
        const ch = Theory.parse(seg.sym);
        if (!ch) continue;
        const b = Theory.bassNote(ch);
        evs.push({ t: t + seg.start, dur: Math.min(2, seg.dur), midi: b, sound: 'bass', vel: 0.8 });
        if (seg.dur === 4) {
          const fifth = Theory.fit((ch.root + 7) % 12, b - 5, b + 6);
          evs.push({ t: t + 2, dur: 2, midi: fifth, sound: 'bass', vel: 0.65 });
        }
        // Comping: Charleston (1 und geswingtes „und“ von 2) — ohne Aufblitzen:
        // der Griff wird von highlightChordScale die ganze Akkorddauer angezeigt
        const v = Theory.rootlessVoicing(ch, barIdx % 2 ? 'B' : 'A');
        v.forEach(n => evs.push({ t: t + seg.start, dur: 1.4, midi: n, sound: 'piano', vel: 0.32 }));
        if (seg.dur === 4) v.forEach(n => evs.push({ t: t + 1.667, dur: 0.7, midi: n, sound: 'piano', vel: 0.22 }));
      }
      // Swing-Ride: 1  2  2-und(geswingt)  3  4  4-und(geswingt), Akzent auf 2 und 4
      for (let i = 0; i < 4; i++) evs.push({ t: t + i, dur: 0.1, sound: 'tick', accent: i === 1 || i === 3 });
      evs.push({ t: t + 1.667, dur: 0.1, sound: 'tick', accent: false });
      evs.push({ t: t + 3.667, dur: 0.1, sound: 'tick', accent: false });
    });
    return { evs, beats: prog.bars.length * 4 };
  }

  function improChordAt(prog, beat) {
    const bar = prog.bars[Math.floor(beat / 4) % prog.bars.length];
    const b = beat % 4;
    if (bar.length === 1 || b < 2) return bar[0];
    if (bar.length === 2 || b < 3) return bar[1];
    return bar[2];
  }

  // Swing: Offbeat-Achtel (x.5) auf die Triolenposition (~x.67) schieben
  const swingBeat = b => {
    const f = b - Math.floor(b);
    return Math.abs(f - 0.5) < 0.01 ? b + 0.167 : b;
  };

  // Ton relativ zum Akkord einordnen: Gerüst (Akkordton) / Verbindung (Skala) / Würze (chromatisch)
  const FUNC = { gerust: 'Gerüst', verb: 'Verbindung', wurze: 'Würze' };
  function classifyNote(pc, ch) {
    if (ch.tones.includes(pc)) return 'gerust';
    if (ch.scale.includes(pc)) return 'verb';
    return 'wurze';
  }
  function lickChordAt(lick, beat) {
    let sym = lick.harmony[0][1];
    for (const [b, s] of lick.harmony) if (b <= beat + 1e-6) sym = s;
    return sym;
  }

  function highlightChordScale(sym, barIdx = 0) {
    const ch = Theory.parse(sym);
    kbd.clear();
    if (!ch) return;
    const show = state.improShow;
    if (show.scale) kbd.lightPitchClasses(ch.scale.filter(pc => !ch.tones.includes(pc)), 'scale');
    if (show.chord) kbd.lightPitchClasses(ch.tones.filter(pc => pc !== ch.root), 'chord');
    if (show.root) kbd.lightPitchClasses([ch.root], 'root');
    // Der gespielte Griff (Comping-Voicing) bleibt die ganze Akkorddauer sichtbar
    kbd.lightNotes(Theory.rootlessVoicing(ch, barIdx % 2 ? 'B' : 'A'), 'lh');
  }

  function renderImpro() {
    const prog = PROGRESSIONS.find(p => p.id === state.prog) || PROGRESSIONS[0];
    const tempo = state.improTempo || prog.tempo;

    stage().innerHTML = `
      <div class="chips">${PROGRESSIONS.map(p =>
        `<button class="chip${p.id === prog.id ? ' on' : ''}" data-p="${p.id}">${p.name}</button>`).join('')}</div>
      <div class="nowchord"><span class="cur" id="imCur">${fmtChord(prog.bars[0][0])}</span><span class="nxt" id="imNext"></span></div>
      <div class="tip">${prog.tip}</div>
      <div class="controls">
        <button class="playbtn" id="imPlay">▶</button>
        <label class="tempo">♩=<span id="imBpm">${tempo}</span>
          <input type="range" id="imTempo" min="60" max="200" value="${tempo}">
        </label>
      </div>
      <div class="licks">${LICKS.map((l, i) =>
        `<button class="chip lick" data-l="${i}" title="${l.name} · ${l.ctx}">${l.short}</button>`).join('')}</div>
      <label class="switch" id="anaSwitch">
        <input type="checkbox" id="anaChk"${state.improAnalyze ? ' checked' : ''}>
        <span class="track"></span>
        <span>Lick-Analyse</span>
      </label>
      <div class="lickinfo" id="lickInfo"></div>
      <div class="legend" id="improLegend"></div>`;

    const renderLegend = () => {
      const el = $('#improLegend');
      if (state.improAnalyze) {
        el.innerHTML = ['gerust', 'verb', 'wurze'].map(k =>
          `<span class="lg static"><i class="sw ${k}"></i>${FUNC[k]}</span>`).join('');
      } else {
        el.innerHTML = ['root', 'chord', 'scale'].map(k => `
          <button class="lg${state.improShow[k] ? ' on' : ''}" data-k="${k}">
            <i class="sw ${k}"></i>${{ root: 'Grundton', chord: 'Akkordton', scale: 'Skala' }[k]}
          </button>`).join('');
        el.querySelectorAll('.lg[data-k]').forEach(b => b.onclick = () => {
          const k = b.dataset.k;
          state.improShow[k] = !state.improShow[k]; save();
          b.classList.toggle('on', state.improShow[k]);
          highlightChordScale(currentSym, currentBar);
        });
      }
    };

    kbd.setRange(36, 96);
    let currentSym = prog.bars[0][0];
    let currentBar = 0;
    highlightChordScale(currentSym, currentBar);
    renderLegend();

    $('#anaChk').onchange = e => {
      state.improAnalyze = e.target.checked; save();
      renderLegend();
      $('#lickInfo').textContent = '';
      if (!state.improAnalyze) highlightChordScale(currentSym, currentBar);
    };

    stage().querySelectorAll('.chip[data-p]').forEach(c => c.onclick = () => {
      player.stop();
      state.prog = c.dataset.p; state.improTempo = null; save(); renderImpro();
    });

    $('#imPlay').onclick = () => {
      if (player.playing) { player.stop(); $('#imPlay').textContent = '▶'; return; }
      const { evs, beats } = improEvents(prog);
      $('#imPlay').textContent = '■';
      player.play(evs, {
        tempo: state.improTempo || prog.tempo,
        loopBeats: beats, countIn: 4,
        onBeat: b => {
          const sym = improChordAt(prog, b);
          const nxt = improChordAt(prog, (b + 4 - (b % 4)) % beats);
          const curEl = $('#imCur'), nxtEl = $('#imNext');
          if (curEl) curEl.textContent = fmtChord(sym);
          if (nxtEl) nxtEl.textContent = nxt !== sym ? '→ ' + fmtChord(nxt) : '';
          const barIdx = Math.floor(b / 4);
          if (sym !== currentSym || barIdx !== currentBar) {
            currentSym = sym; currentBar = barIdx;
            highlightChordScale(sym, barIdx);
          }
        },
      });
    };
    $('#imTempo').oninput = e => {
      state.improTempo = +e.target.value; $('#imBpm').textContent = e.target.value; save();
      player.setTempo(state.improTempo);
    };
    stage().querySelectorAll('.lick').forEach(b => b.onclick = () => {
      const lick = LICKS[+b.dataset.l];
      const analyze = state.improAnalyze;
      // Loop immer pausieren: das Lick bringt seine eigene, harmonisch passende
      // Begleitung mit (über fremden Loop-Akkorden würde es schräg klingen)
      if (player.playing) { player.stop(); $('#imPlay').textContent = '▶'; }
      if (analyze) kbd.clear();
      // In der Analyse langsamer, damit man jeden Ton erfassen kann
      const spb = 60 / (analyze ? 56 : (state.improTempo || prog.tempo));
      const t0 = Sound.now() + 0.1;
      const info = $('#lickInfo');
      if (info) info.textContent = analyze ? lick.name + ' · ' + lick.ctx : '';

      // Die Akkorde des Licks als leise Begleitung mitspielen
      const lickEnd = swingBeat(lick.notes.at(-1)[0] + lick.notes.at(-1)[1]);
      lick.harmony.forEach(([beat, sym], i) => {
        const end = i + 1 < lick.harmony.length ? lick.harmony[i + 1][0] : lickEnd;
        const ch = Theory.parse(sym);
        if (!ch) return;
        const dur = (end - beat) * spb;
        Sound.bass(Theory.bassNote(ch), t0 + beat * spb, dur, 0.7);
        Theory.rootlessVoicing(ch, i % 2 ? 'B' : 'A')
          .forEach(n => Sound.piano(n, t0 + beat * spb, dur * 0.92, 0.24));
      });

      // Melodie mit Swing (Offbeats auf Triolenposition) und leichten Offbeat-Akzenten
      for (const [t, d, n] of lick.notes) {
        const s = swingBeat(t), dur = swingBeat(t + d) - s;
        const off = Math.abs(t - Math.floor(t) - 0.5) < 0.01;
        Sound.piano(n, t0 + s * spb, dur * spb, off ? 0.9 : 0.78);
        const at = Math.max(0, (t0 - Sound.now() + s * spb) * 1000);
        if (analyze) {
          const ch = Theory.parse(lickChordAt(lick, t));
          const cls = classifyNote(n % 12, ch);
          setTimeout(() => {
            kbd.flash(n, cls, Math.max(dur * spb * 1000 - 40, 550));
            if (info) info.innerHTML =
              `<b class="fn-${cls}">${Theory.noteName(n)} = ${Theory.intervalName(n % 12, ch)} von ${fmtChord(ch.symbol)}</b> · ${FUNC[cls]}`;
          }, at);
        } else {
          setTimeout(() => kbd.flash(n, 'rh', Math.max(dur * spb * 1000 - 40, 90)), at);
        }
      }
      if (analyze) {
        const endMs = (t0 - Sound.now() + lickEnd * spb) * 1000;
        setTimeout(() => { if (info) info.textContent = lick.name + ' · ' + lick.ctx; }, endMs + 400);
      }
    });
  }

  // ---------- Modus-Wechsel ----------
  function setMode(m) {
    state.mode = m; save();
    player.stop();
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.m === m));
    if (m === 'song') renderSong();
    else if (m === 'chords') { drill = null; renderChords(); }
    else renderImpro();
  }

  function init() {
    kbd = new Keyboard($('#kbd'));
    player = new Player(kbd);
    document.querySelectorAll('.tab').forEach(t => t.onclick = () => setMode(t.dataset.m));
    // iOS-Audio: bei jeder Geste entsperren/aufwecken (billig, wenn schon aktiv)
    const wake = () => Sound.unlock();
    document.body.addEventListener('touchend', wake, { passive: true });
    document.body.addEventListener('mousedown', wake);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) Sound.ensure(); });
    setMode(state.mode);
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);

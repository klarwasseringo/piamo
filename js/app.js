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
      songId: 'foggy', phraseBy: {}, tempoBy: {},
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
  const allSongs = () => [...SONGS, ...SongImport.UserSongs.load()];
  const curSong = () => allSongs().find(s => s.id === state.songId) || SONGS[0];
  const barBeats = (song, bar) => bar.beats || song.beatsPerBar || 4;
  // Alt-Zustand aus der Ein-Song-Zeit übernehmen
  const songPhrase = song => state.phraseBy[song.id] ?? (song.id === 'foggy' ? (state.phrase || 0) : 0);
  const songTempo = song => state.tempoBy[song.id] ?? (song.id === 'foggy' ? (state.songTempo || song.tempo) : song.tempo);

  // mel/lh-Einträge: [beat, dauer, midi] oder [beat, dauer, [midi, midi, ...]]
  function pushVoice(evs, beat, entries, cls, vel) {
    for (const [b, d, n] of entries) {
      const notes = Array.isArray(n) ? n : [n];
      for (const m of notes) evs.push({ t: beat + b, dur: d, midi: m, cls, sound: 'piano', vel });
    }
  }

  function songEvents(song, from, to, hands) {
    const evs = [];
    let beat = 0;
    for (let i = from; i <= to; i++) {
      const bar = song.bars[i];
      if (hands !== 'lh') pushVoice(evs, beat, bar.mel, 'rh', 0.85);
      if (hands !== 'rh') {
        if (bar.lh) pushVoice(evs, beat, bar.lh, 'lh', 0.5);
        else for (const [sym, b, d] of bar.chords) {
          const v = Theory.shellVoicing(Theory.parse(sym));
          v.forEach(n => evs.push({ t: beat + b, dur: d, midi: n, cls: 'lh', sound: 'piano', vel: 0.45 }));
        }
      }
      beat += barBeats(song, bar);
    }
    return { evs, beats: beat };
  }

  function chordAtBeat(song, from, beat) {
    let acc = 0;
    for (let i = from; i < song.bars.length; i++) {
      const bar = song.bars[i], len = barBeats(song, bar);
      if (beat < acc + len) {
        if (!bar.chords.length) return '';
        const inBar = beat - acc;
        let cur = bar.chords[0][0];
        for (const [sym, b] of bar.chords) if (b <= inBar) cur = sym;
        return cur;
      }
      acc += len;
    }
    return '';
  }

  function renderSong() {
    const song = curSong();
    const phrase = Math.min(songPhrase(song), song.phrases.length - 1);
    const ph = song.phrases[phrase];
    const tempo = songTempo(song);
    const beatSym = (song.beatsPerBar || 4) === 4 ? '♩' : '♪';

    stage().innerHTML = `
      <div class="chips">${allSongs().map(s =>
        `<button class="chip${s.id === song.id ? ' on' : ''}" data-s="${s.id}">${s.title}</button>`).join('')}
        <button class="chip add" id="songImport" title="Song importieren">＋</button></div>
      <div class="phrase-nav">
        <button class="navbtn" id="phPrev">‹</button>
        <div class="phrase-title">
          <div class="phrase-name">${ph.name}</div>
          <div class="dots">${song.phrases.map((_, i) =>
            `<span class="dot${i === phrase ? ' on' : ''}" data-i="${i}"></span>`).join('')}</div>
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
        <label class="tempo">${beatSym}=<span id="songBpm">${tempo}</span>
          <input type="range" id="songTempo" min="50" max="220" value="${tempo}">
        </label>
      </div>`;

    const fitPhrase = () => {
      const { evs } = songEvents(song, ph.from, ph.to, state.hands);
      kbd.fitTo(evs.filter(e => e.midi).map(e => e.midi));
      kbd.clear();
    };
    fitPhrase();

    stage().querySelectorAll('.chip[data-s]').forEach(c => c.onclick = () => {
      player.stop();
      state.songId = c.dataset.s; save(); renderSong();
    });
    $('#songImport').onclick = () => { player.stop(); renderImport(); };

    const setPhrase = i => {
      player.stop(); resetPlayBtn();
      state.phraseBy[song.id] = (i + song.phrases.length) % song.phrases.length;
      save(); renderSong();
    };
    $('#phPrev').onclick = () => setPhrase(phrase - 1);
    $('#phNext').onclick = () => setPhrase(phrase + 1);
    stage().querySelectorAll('.dot').forEach(d => d.onclick = () => setPhrase(+d.dataset.i));

    const resetPlayBtn = () => { const b = $('#songPlay'); if (b) b.textContent = '▶'; };
    $('#songPlay').onclick = () => {
      if (player.playing) { player.stop(); resetPlayBtn(); $('#songChord').innerHTML = '&nbsp;'; return; }
      const { evs, beats } = songEvents(song, ph.from, ph.to, state.hands);
      $('#songPlay').textContent = '■';
      player.play(evs, {
        tempo: songTempo(song),
        loopBeats: state.songLoop ? beats : null,
        countIn: song.beatsPerBar || 4,
        onBeat: b => { const el = $('#songChord'); if (el) el.textContent = fmtChord(chordAtBeat(song, ph.from, b)); },
        onEnd: () => { resetPlayBtn(); },
      });
    };
    $('#songLoop').onclick = e => { state.songLoop = !state.songLoop; save(); e.target.classList.toggle('on', state.songLoop); };
    stage().querySelectorAll('.segbtn').forEach(b => b.onclick = () => {
      state.hands = b.dataset.h; save();
      player.stop(); resetPlayBtn(); renderSong();
    });
    $('#songTempo').oninput = e => {
      state.tempoBy[song.id] = +e.target.value; $('#songBpm').textContent = e.target.value; save();
      player.setTempo(+e.target.value);
    };
  }

  // ---------- Song-Import ----------
  function renderImport() {
    const userSongs = SongImport.UserSongs.load();
    const apiKey = localStorage.getItem('piamo.apiKey') || '';

    stage().innerHTML = `
      <div class="lesson-head">
        <button class="navbtn sm" id="impBack">‹</button>
        <div class="lesson-title">Song importieren</div>
        <div style="width:34px"></div>
      </div>
      <div class="imp-card">
        <div class="imp-title">📄 MusicXML — note-exakt (empfohlen)</div>
        <div class="imp-hint">Noten mit <b>PlayScore 2</b> (iPhone) scannen oder in <b>MuseScore</b> öffnen und als
          MusicXML exportieren. Dann hier laden (.musicxml, .xml oder .mxl).</div>
        <label class="nextbtn filebtn">Datei wählen
          <input type="file" id="impXml" accept=".xml,.musicxml,.mxl" hidden>
        </label>
      </div>
      <div class="imp-card">
        <div class="imp-title">📷 Foto → KI — Akkorde &amp; Gerüst</div>
        <div class="imp-hint">Notenfotos an die Claude-API schicken. Akkorde, Form und Rhythmus werden zuverlässig
          erkannt, einzelne Noten sind Näherung. Dein API-Key bleibt nur auf diesem Gerät.</div>
        <input type="password" id="impKey" class="keyinput" placeholder="Claude API-Key (sk-ant-…)" value="${apiKey}">
        <label class="nextbtn filebtn">Foto(s) wählen
          <input type="file" id="impPhoto" accept="image/*" multiple hidden>
        </label>
      </div>
      <div class="imp-status" id="impStatus"></div>
      ${userSongs.length ? `
      <div class="imp-card">
        <div class="imp-title">Importierte Songs</div>
        ${userSongs.map(s => `
          <div class="imp-row"><span>${s.title}</span>
            <button class="navbtn sm del" data-del="${s.id}">✕</button></div>`).join('')}
      </div>` : ''}`;

    kbd.setRange(48, 84); kbd.clear();
    const status = msg => { const el = $('#impStatus'); if (el) el.textContent = msg; };
    const finish = song => {
      const saved = SongImport.UserSongs.add(song);
      state.songId = saved.id;
      state.phraseBy[saved.id] = 0;
      save();
      renderSong();
    };

    $('#impBack').onclick = () => renderSong();

    $('#impXml').onchange = async e => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        status('Lese ' + file.name + ' …');
        const song = await SongImport.fromFile(file);
        status(`„${song.title}“: ${song.bars.length} Takte importiert ✓`);
        setTimeout(() => finish(song), 600);
      } catch (err) { status('⚠️ ' + err.message); }
    };

    $('#impPhoto').onchange = async e => {
      const files = [...e.target.files];
      if (!files.length) return;
      const key = $('#impKey').value.trim();
      if (!key) { status('⚠️ Bitte zuerst den API-Key eintragen.'); return; }
      localStorage.setItem('piamo.apiKey', key);
      try {
        const song = await SongImport.fromPhotos(files, key, status);
        status(`„${song.title}“: ${song.bars.length} Takte importiert ✓`);
        setTimeout(() => finish(song), 600);
      } catch (err) { status('⚠️ ' + err.message); }
    };

    stage().querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      const id = b.dataset.del;
      const s = userSongs.find(x => x.id === id);
      if (confirm(`„${s.title}“ wirklich löschen?`)) {
        SongImport.UserSongs.remove(id);
        if (state.songId === id) state.songId = 'foggy';
        save();
        renderImport();
      }
    });
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

  // Akkordqualität grob klassifizieren (für „passt dieses Lick auf diesen Takt?“)
  const QCLASS = t =>
    (t === 'dom' || t === 'lyddom' || t === 'alt' || t === 'domdim') ? 'dom' :
    (t === 'maj' || t === 'lyd') ? 'maj' :
    (t === 'min' || t === 'melmin') ? 'min' : t;

  // Lick-Melodie planen (Swing + Offbeat-Akzente); off = Transposition in Halbtönen
  function scheduleLickNotes(lick, off, t0, spb, analyze, info) {
    for (const [t, d, n0] of lick.notes) {
      const n = n0 + off;
      const s = swingBeat(t), dur = swingBeat(t + d) - s;
      const offbeat = Math.abs(t - Math.floor(t) - 0.5) < 0.01;
      Sound.piano(n, t0 + s * spb, dur * spb, offbeat ? 0.9 : 0.78);
      const at = Math.max(0, (t0 - Sound.now() + s * spb) * 1000);
      if (analyze) {
        const ch = Theory.parse(lickChordAt(lick, t));
        const cls = classifyNote(n0 % 12, ch);
        setTimeout(() => {
          kbd.flash(n, cls, Math.max(dur * spb * 1000 - 40, 550));
          if (info) info.innerHTML =
            `<b class="fn-${cls}">${Theory.noteName(n)} = ${Theory.intervalName(n0 % 12, ch)} von ${fmtChord(ch.symbol)}</b> · ${FUNC[cls]}`;
        }, at);
      } else {
        setTimeout(() => kbd.flash(n, 'rh', Math.max(dur * spb * 1000 - 40, 90)), at);
      }
    }
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
      const info = $('#lickInfo');

      // Loop läuft (keine Analyse): Lick am nächsten harmonisch passenden Takt
      // einfädeln und dorthin transponieren — der Loop spielt einfach weiter.
      if (player.playing && !analyze) {
        const totalBeats = prog.bars.length * 4;
        const lickCh = Theory.parse(lick.harmony[0][1]);
        const nowBeat = (Sound.now() - player.start) / player.spb;
        const firstBar = Math.ceil((nowBeat + 1) / 4); // mind. 1 Schlag Vorlauf

        // Alle Einstiegstakte des Loops bewerten: wie viele Akkorde des Licks
        // passen dort (transponiert) zur Loop-Harmonie? Bester Score gewinnt,
        // bei Gleichstand der früheste Einstieg.
        let best = null;
        for (let k = 0; k < prog.bars.length; k++) {
          const barNo = firstBar + k;
          const startSym = improChordAt(prog, (barNo * 4) % totalBeats);
          const startCh = Theory.parse(startSym);
          if (!startCh || QCLASS(startCh.scaleType) !== QCLASS(lickCh.scaleType)) continue;
          let off = (startCh.root - lickCh.root) % 12;
          if (off > 6) off -= 12;
          if (off < -6) off += 12;
          let score = 0;
          for (const [hb, hsym] of lick.harmony) {
            const lch = Theory.parse(hsym);
            const pch = Theory.parse(improChordAt(prog, (barNo * 4 + hb) % totalBeats));
            if (!lch || !pch || QCLASS(pch.scaleType) !== QCLASS(lch.scaleType)) continue;
            score += pch.root === (lch.root + off + 12) % 12 ? 2 : 1;
          }
          if (!best || score > best.score) best = { barNo, off, score, sym: startSym };
        }

        if (best) {
          scheduleLickNotes(lick, best.off, player.start + best.barNo * 4 * player.spb, player.spb, false, info);
          if (info) {
            const warten = Math.max(1, Math.round(best.barNo * 4 - nowBeat));
            info.textContent = `${lick.name} · kommt in ${warten} Schlägen über ${fmtChord(best.sym)}`;
            setTimeout(() => { if (info.textContent.startsWith(lick.name)) info.textContent = ''; },
              (best.barNo * 4 - nowBeat + 8) * player.spb * 1000);
          }
          return;
        }
        // Kein passender Akkordtyp im Loop → Loop anhalten, Lick mit eigener Begleitung
        player.stop(); $('#imPlay').textContent = '▶';
      }

      if (analyze) {
        if (player.playing) { player.stop(); $('#imPlay').textContent = '▶'; }
        kbd.clear();
      }
      // In der Analyse langsamer, damit man jeden Ton erfassen kann
      const spb = 60 / (analyze ? 56 : (state.improTempo || prog.tempo));
      const t0 = Sound.now() + 0.1;
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

      scheduleLickNotes(lick, 0, t0, spb, analyze, info);
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

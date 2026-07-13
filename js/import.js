// import.js — Song-Import: MusicXML (note-exakt) und Foto→Claude-API (Lead-Sheet)
// Importierte Songs bleiben privat im localStorage des Geräts.
'use strict';

const SongImport = (() => {

  // ---------- Speicher ----------
  const KEY = 'piamo.userSongs';
  const UserSongs = {
    load() {
      try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
    },
    save(list) { localStorage.setItem(KEY, JSON.stringify(list)); },
    add(song) {
      const list = UserSongs.load();
      song.id = 'u' + Date.now().toString(36);
      song.user = true;
      list.push(song);
      UserSongs.save(list);
      return song;
    },
    remove(id) { UserSongs.save(UserSongs.load().filter(s => s.id !== id)); },
  };

  // ---------- MXL (ZIP) entpacken ----------
  async function unzipMxl(buf) {
    if (typeof DecompressionStream === 'undefined')
      throw new Error('Dieser Browser kann .mxl nicht entpacken — bitte unkomprimiertes .musicxml exportieren.');
    const dv = new DataView(buf);
    const u8 = new Uint8Array(buf);
    // End-of-Central-Directory suchen (letzte 64 KB)
    let eocd = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65558); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('Keine gültige .mxl-Datei (ZIP-Ende fehlt).');
    const count = dv.getUint16(eocd + 10, true);
    let off = dv.getUint32(eocd + 16, true);
    const entries = [];
    const td = new TextDecoder();
    for (let k = 0; k < count; k++) {
      if (dv.getUint32(off, true) !== 0x02014b50) break;
      const method = dv.getUint16(off + 10, true);
      const compSize = dv.getUint32(off + 20, true);
      const nameLen = dv.getUint16(off + 28, true);
      const extraLen = dv.getUint16(off + 30, true);
      const commentLen = dv.getUint16(off + 32, true);
      const localOff = dv.getUint32(off + 42, true);
      const name = td.decode(u8.subarray(off + 46, off + 46 + nameLen));
      entries.push({ name, method, compSize, localOff });
      off += 46 + nameLen + extraLen + commentLen;
    }
    const entry = entries.find(e => !e.name.startsWith('META-INF') && /\.(musicxml|xml)$/i.test(e.name));
    if (!entry) throw new Error('Kein MusicXML in der .mxl-Datei gefunden.');
    const lNameLen = dv.getUint16(entry.localOff + 26, true);
    const lExtraLen = dv.getUint16(entry.localOff + 28, true);
    const start = entry.localOff + 30 + lNameLen + lExtraLen;
    const data = u8.subarray(start, start + entry.compSize);
    if (entry.method === 0) return td.decode(data);
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return await new Response(stream).text();
  }

  // ---------- MusicXML → Songformat ----------
  const STEP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function pitchToMidi(p) {
    const step = p.querySelector('step').textContent.trim();
    const alter = +(p.querySelector('alter')?.textContent || 0);
    const oct = +p.querySelector('octave').textContent;
    return (oct + 1) * 12 + STEP[step] + alter;
  }

  const KIND_MAP = {
    'major': '', 'minor': 'm', 'dominant': '7', 'major-seventh': 'maj7', 'minor-seventh': 'm7',
    'dominant-ninth': '9', 'dominant-11th': '11', 'dominant-13th': '13', 'major-ninth': 'maj9',
    'major-sixth': '6', 'minor-sixth': 'm6', 'minor-ninth': 'm9', 'diminished': 'dim',
    'diminished-seventh': 'dim7', 'half-diminished': 'm7b5', 'augmented': '+',
    'suspended-fourth': 'sus4', 'suspended-second': 'sus2', 'minor-major': 'm(maj7)', 'power': '5',
  };
  const PC_NAME = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  function harmonyToSym(h) {
    const rs = h.querySelector('root root-step');
    if (!rs) return null;
    const alter = +(h.querySelector('root root-alter')?.textContent || 0);
    const root = PC_NAME[(STEP[rs.textContent.trim()] + alter + 12) % 12];
    const kindEl = h.querySelector('kind');
    const suffix = kindEl?.getAttribute('text') ?? KIND_MAP[kindEl?.textContent.trim()] ?? '';
    let sym = root + suffix;
    const bs = h.querySelector('bass bass-step');
    if (bs) {
      const bAlter = +(h.querySelector('bass bass-alter')?.textContent || 0);
      sym += '/' + PC_NAME[(STEP[bs.textContent.trim()] + bAlter + 12) % 12];
    }
    return sym;
  }

  function parseXmlText(xmlText, fallbackTitle) {
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('Datei ist kein gültiges MusicXML.');

    // Erste Stimme mit Noten (beim Klavier: ein Part mit zwei Systemen)
    const parts = [...doc.querySelectorAll('part')];
    const part = parts.find(p => p.querySelector('note pitch')) || parts[0];
    if (!part) throw new Error('Keine Noten gefunden.');

    let divisions = 1, beatsPB = 4, tempo = 0;
    const bars = [];
    const openTies = {};   // "staff:midi" → Event-Array-Referenz für gebundene Noten

    for (const m of part.querySelectorAll('measure')) {
      const divEl = m.querySelector('attributes divisions');
      if (divEl) divisions = +divEl.textContent || divisions;
      const time = m.querySelector('attributes time');
      if (time) beatsPB = +time.querySelector('beats').textContent * 4 / +time.querySelector('beat-type').textContent;
      const soundEl = m.querySelector('sound[tempo]');
      if (soundEl && !tempo) tempo = Math.round(+soundEl.getAttribute('tempo'));

      let pos = 0, lastStart = 0;
      const mel = [], lh = [], chords = [];

      for (const node of m.children) {
        const tag = node.tagName;
        if (tag === 'backup') { pos -= +node.querySelector('duration').textContent / divisions; continue; }
        if (tag === 'forward') { pos += +node.querySelector('duration').textContent / divisions; continue; }
        if (tag === 'harmony') {
          const sym = harmonyToSym(node);
          if (sym) chords.push([sym, Math.max(0, pos), beatsPB - Math.max(0, pos)]);
          continue;
        }
        if (tag !== 'note') continue;
        if (node.querySelector(':scope > grace')) continue;
        const durQ = +(node.querySelector(':scope > duration')?.textContent || 0) / divisions;
        const isChord = !!node.querySelector(':scope > chord');
        const start = isChord ? lastStart : pos;
        const pitch = node.querySelector(':scope > pitch');
        if (pitch && !node.querySelector(':scope > rest')) {
          const midi = pitchToMidi(pitch);
          const staff = +(node.querySelector(':scope > staff')?.textContent || 1);
          const arr = staff >= 2 ? lh : mel;
          const key = staff + ':' + midi;
          const ties = [...node.querySelectorAll(':scope > tie')].map(t => t.getAttribute('type'));
          if (ties.includes('stop') && openTies[key]) {
            openTies[key][1] += durQ;               // gebundene Note verlängern
            if (!ties.includes('start')) delete openTies[key];
          } else {
            const ev = [+start.toFixed(4), +durQ.toFixed(4), midi];
            arr.push(ev);
            if (ties.includes('start')) openTies[key] = ev;
          }
        }
        if (!isChord) { lastStart = pos; pos += durQ; }
      }
      // Akkorddauern bis zum nächsten Symbol begrenzen
      chords.forEach((c, i) => { if (chords[i + 1]) c[2] = chords[i + 1][1] - c[1]; });
      bars.push({ beats: beatsPB, chords, mel, lh });
    }
    if (!bars.length) throw new Error('Keine Takte gefunden.');

    const title = doc.querySelector('work-title')?.textContent.trim()
      || doc.querySelector('movement-title')?.textContent.trim()
      || fallbackTitle;
    const phrases = [];
    for (let i = 0; i < bars.length; i += 4) {
      const to = Math.min(i + 3, bars.length - 1);
      phrases.push({ name: `Takte ${i + 1}–${to + 1}`, from: i, to });
    }
    return { title, composer: 'Import', tempo: tempo || 100, beatsPerBar: 4, bars, phrases };
  }

  async function fromFile(file) {
    let xmlText;
    if (/\.mxl$/i.test(file.name)) xmlText = await unzipMxl(await file.arrayBuffer());
    else xmlText = await file.text();
    return parseXmlText(xmlText, file.name.replace(/\.(musicxml|xml|mxl)$/i, ''));
  }

  // ---------- Foto → Claude-API ----------
  async function imageToJpegBase64(file, maxDim = 1568) {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
  }

  const PHOTO_PROMPT = `Du bekommst Fotos von Klaviernoten. Wandle sie in dieses JSON-Format um (NUR das JSON ausgeben, kein anderer Text):
{"title":"...","tempo":100,"beatsPerBar":4,"bars":[{"chords":[["Cmaj7",0,4]],"mel":[[0,1,72]],"lh":[[0,4,[48,55]]]}],"phrases":[{"name":"...","from":0,"to":3}]}
Regeln:
- 1 Beat = 1 Viertelnote. beatsPerBar aus der Taktart (6/8 → 3). Bei Taktartwechsel im Takt-Objekt "beats" setzen.
- mel = rechte Hand, lh = linke Hand. Ein Eintrag: [startBeat, dauerInBeats, midiNote] oder [start, dauer, [mehrere Noten]].
- chords: Akkordsymbole (z.B. "Gm7", "C13", "F/A") mit [symbol, startBeat, dauer]. Wenn keine Symbole gedruckt sind, leite sie aus den Noten ab.
- Akkordsymbole und Rhythmus haben Priorität; wenn einzelne Noten unlesbar sind, setze musikalisch plausible Akkordtöne.
- phrases: sinnvolle 2-8-Takt-Abschnitte mit kurzen Namen.
- Antworte AUSSCHLIESSLICH mit dem JSON-Objekt.`;

  async function fromPhotos(files, apiKey, onStatus) {
    onStatus('Bilder werden vorbereitet …');
    const images = [];
    for (const f of files) images.push(await imageToJpegBase64(f));
    onStatus(`${images.length} Bild(er) → Claude wird befragt (kann 1–2 Minuten dauern) …`);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 32000,
        messages: [{
          role: 'user',
          content: [
            ...images.map(data => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } })),
            { type: 'text', text: PHOTO_PROMPT },
          ],
        }],
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error('API-Fehler ' + res.status + ': ' + (err?.error?.message || res.statusText));
    }
    const data = await res.json();
    let text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
    text = text.replace(/^```(json)?\s*/i, '').replace(/```\s*$/, '').trim();
    const first = text.indexOf('{'), last = text.lastIndexOf('}');
    if (first < 0 || last < 0) throw new Error('Antwort enthielt kein JSON.');
    const song = JSON.parse(text.slice(first, last + 1));
    validateSong(song);
    song.composer = 'KI-Import';
    return song;
  }

  function validateSong(s) {
    if (!s || !Array.isArray(s.bars) || !s.bars.length) throw new Error('Songdaten unvollständig (keine Takte).');
    s.title = String(s.title || 'Importierter Song');
    s.tempo = +s.tempo || 100;
    s.beatsPerBar = +s.beatsPerBar || 4;
    for (const bar of s.bars) {
      bar.chords = Array.isArray(bar.chords) ? bar.chords : [];
      bar.mel = Array.isArray(bar.mel) ? bar.mel : [];
      if (bar.lh && !Array.isArray(bar.lh)) delete bar.lh;
    }
    if (!Array.isArray(s.phrases) || !s.phrases.length) {
      s.phrases = [];
      for (let i = 0; i < s.bars.length; i += 4) {
        const to = Math.min(i + 3, s.bars.length - 1);
        s.phrases.push({ name: `Takte ${i + 1}–${to + 1}`, from: i, to });
      }
    }
    s.phrases = s.phrases.filter(p => p.from >= 0 && p.to < s.bars.length && p.from <= p.to);
  }

  return { UserSongs, fromFile, fromPhotos, parseXmlText };
})();

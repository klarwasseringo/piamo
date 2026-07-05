// keyboard.js — SVG-Klaviatur (reine Anzeige, nicht antippbar)
'use strict';

class Keyboard {
  constructor(container, lo = 36, hi = 84) { // C2..C6
    this.container = container;
    this.setRange(lo, hi);
  }

  static isBlack(m) { return [1, 3, 6, 8, 10].includes(m % 12); }

  setRange(lo, hi) {
    while (Keyboard.isBlack(lo)) lo--;
    while (Keyboard.isBlack(hi)) hi++;
    this.lo = lo; this.hi = hi;
    this.render();
  }

  // Bereich automatisch an Inhalt anpassen (mit Rand, auf Oktavgrenzen gerundet)
  fitTo(midis, minSpan = 24) {
    if (!midis || !midis.length) return;
    let lo = Math.min(...midis) - 2, hi = Math.max(...midis) + 2;
    while (hi - lo < minSpan) { lo--; hi++; }
    lo = Math.max(21, Math.floor(lo / 12) * 12);              // auf C abrunden
    hi = Math.min(108, Math.ceil((hi + 1) / 12) * 12);        // auf C aufrunden
    if (lo !== this.lo || hi !== this.hi) this.setRange(lo, hi);
  }

  render() {
    const whites = [];
    for (let m = this.lo; m <= this.hi; m++) if (!Keyboard.isBlack(m)) whites.push(m);
    const W = 100, ww = W / whites.length, bw = ww * 0.62, H = 30, bh = H * 0.62;
    let svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">`;
    this.keyEls = {};
    let parts = [], blackParts = [], labels = [];
    whites.forEach((m, i) => {
      const x = i * ww;
      parts.push(`<rect id="k${m}" class="wkey" x="${x.toFixed(3)}" y="0" width="${ww.toFixed(3)}" height="${H}" rx="0.35"/>`);
      if (m % 12 === 0) labels.push(`<text class="klabel" x="${(x + ww / 2).toFixed(3)}" y="${H - 1.4}">C${m / 12 - 1}</text>`);
    });
    whites.forEach((m, i) => {
      const b = m + 1;
      if (b < this.hi && Keyboard.isBlack(b)) {
        const x = (i + 1) * ww - bw / 2;
        blackParts.push(`<rect id="k${b}" class="bkey" x="${x.toFixed(3)}" y="0" width="${bw.toFixed(3)}" height="${bh}" rx="0.3"/>`);
      }
    });
    svg += parts.join('') + blackParts.join('') + labels.join('') + '</svg>';
    this.container.innerHTML = svg;
  }

  clear() {
    this.container.querySelectorAll('.wkey,.bkey').forEach(el =>
      el.classList.remove('lit-rh', 'lit-lh', 'lit-chord', 'lit-scale', 'lit-root'));
  }

  // classes: {midi: 'rh'|'lh'|'chord'|'scale'|'root'}
  light(map, additive = false) {
    if (!additive) this.clear();
    for (const [m, cls] of Object.entries(map)) {
      const el = this.container.querySelector(`#k${m}`);
      if (el) el.classList.add('lit-' + cls);
    }
  }

  lightNotes(midis, cls, additive = true) {
    const map = {};
    midis.forEach(m => map[m] = cls);
    this.light(map, additive);
  }

  // Pitch-Classes über die ganze Tastatur (für Skalen im Impro-Modus)
  lightPitchClasses(pcs, cls, additive = true) {
    if (!additive) this.clear();
    for (let m = this.lo; m <= this.hi; m++) {
      if (pcs.includes(m % 12)) {
        const el = this.container.querySelector(`#k${m}`);
        if (el) el.classList.add('lit-' + cls);
      }
    }
  }

  flash(midi, cls, ms) {
    const el = this.container.querySelector(`#k${midi}`);
    if (!el) return;
    el.classList.add('lit-' + cls);
    // Mindest-Leuchtdauer, und laufende Abschalt-Timer derselben Taste ersetzen
    // (sonst löscht der alte Timer ein frisches Aufleuchten zu früh)
    const key = '_flash_' + cls;
    if (el[key]) clearTimeout(el[key]);
    el[key] = setTimeout(() => { el.classList.remove('lit-' + cls); el[key] = null; }, Math.max(ms, 320));
  }
}

// audio.js — Web-Audio-Klaviersynth (kein Sample-Download nötig, offline-fähig)
'use strict';

const Sound = (() => {
  let ctx = null, master = null;

  function ensure() {
    if (!ctx) {
      // iOS 17+: Ton auch bei umgelegtem Stummschalter ausgeben
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createDynamicsCompressor();
      master.threshold.value = -18; master.ratio.value = 4;
      const gain = ctx.createGain();
      gain.gain.value = 0.9;
      master.connect(gain).connect(ctx.destination);
    }
    if (ctx.state !== 'running') ctx.resume(); // 'suspended' und iOS-'interrupted'
    return ctx;
  }

  // iOS-Freischaltung: muss aus einer Nutzer-Geste heraus laufen.
  // Stiller 1-Sample-Puffer entsperrt die Audioausgabe zuverlässig.
  function unlock() {
    ensure();
    try {
      const b = ctx.createBuffer(1, 1, 22050);
      const s = ctx.createBufferSource();
      s.buffer = b; s.connect(ctx.destination); s.start(0);
    } catch (e) {}
  }

  function midiHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // Klavierähnlicher Ton: Grundton + Obertöne, perkussiver Attack, exponentieller Ausklang
  function piano(midi, when, dur = 1, vel = 0.8) {
    ensure();
    const t = Math.max(when, ctx.currentTime);
    const f = midiHz(midi);
    const out = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(1200 + f * 4 + vel * 3000, 9000), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(f * 2, 400), t + Math.min(dur, 1.2));
    lp.Q.value = 0.5;
    out.connect(lp).connect(master);

    const partials = [
      [1, 1.0, 'triangle'], [2, 0.35, 'sine'], [3, 0.16, 'sine'], [4.01, 0.07, 'sine'],
    ];
    const stop = t + dur + 1.4;
    for (const [ratio, amp, type] of partials) {
      if (f * ratio > 8500) continue;
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f * ratio;
      const g = ctx.createGain();
      const peak = vel * amp * 0.32;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + 0.006);
      g.gain.setTargetAtTime(peak * 0.28, t + 0.03, 0.22);       // schneller erster Abfall
      g.gain.setTargetAtTime(0.0001, t + Math.max(dur - 0.06, 0.05), 0.09); // Dämpfer
      o.connect(g).connect(out);
      o.start(t); o.stop(stop);
    }
    // Anschlaggeräusch
    const nl = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    nl.buffer = buf;
    const ng = ctx.createGain(); ng.gain.value = vel * 0.05;
    nl.connect(ng).connect(lp);
    nl.start(t);
  }

  // Weicher Bass für die Begleitung
  function bass(midi, when, dur = 1, vel = 0.7) {
    ensure();
    const t = Math.max(when, ctx.currentTime);
    const f = midiHz(midi);
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 0.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel * 0.5, t + 0.01);
    g.gain.setTargetAtTime(0.0001, t + Math.max(dur - 0.08, 0.05), 0.07);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
    o.connect(g); o2.connect(g); g.connect(lp).connect(master);
    o.start(t); o.stop(t + dur + 0.5);
    o2.start(t); o2.stop(t + dur + 0.5);
  }

  // Ride-artiger Tick für den Puls
  function tick(when, accent = false) {
    ensure();
    const t = Math.max(when, ctx.currentTime);
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = accent ? 1800 : 1400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(accent ? 0.06 : 0.035, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1200;
    o.connect(g).connect(hp).connect(master);
    o.start(t); o.stop(t + 0.08);
  }

  return { ensure, unlock, piano, bass, tick, now: () => ensure().currentTime, ctx: () => ctx };
})();

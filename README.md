# Piamo ♪ — Jazz Piano lernen

Web-App fürs iPhone (neben dem echten Klavier): zeigt auf einer Bildschirm-Klaviatur,
welche Tasten zu spielen sind, und spielt sie vor. Kein App Store, keine Anmeldung —
einfach im Browser öffnen und „Zum Home-Bildschirm hinzufügen".

## Die drei Modi

- **Song** — „A Foggy Day" (Gershwin) in kurzen Phrasen: App spielt vor, Tasten
  leuchten (Melodie orange, linke Hand blau), du spielst nach. Loop, Tempo, RH/LH getrennt.
- **Akkorde** — Jazz-Harmonik-Lehrplan in 11 Lektionen: Grundtypen, Shell-Voicings,
  ii–V–I, Rootless Voicings, Alterationen, Moll-Kadenz, Quarten … bis zu den
  Original-Akkorden aus dem Foggy-Day-Arrangement.
- **Impro** — Backing-Loop (Bass + Comping) über wählbare Changes (ii–V–I, F-Blues,
  Turnaround, Foggy Day, Moll, modal). Auf der Klaviatur leuchten Grundton (rot),
  Akkordtöne (grün) und Skalentöne (dezent) — einfach drauflosspielen. Dazu Licks zum Nachspielen.

## Technik

Reines HTML/CSS/JS ohne Abhängigkeiten. Klaviersound wird per Web Audio synthetisiert
(offline-fähig, kein Download). Fortschritt liegt im localStorage.

Lokal testen: `python -m http.server 8000` im Projektordner, dann http://localhost:8000

## Hinweis zu Noten

Eingescannte Notenblätter (PDF) sind urheberrechtlich geschützt und werden **nicht**
mitversioniert (siehe `.gitignore`). Im Repo liegen nur selbst erstellte Daten
(Akkordfolgen, Übungsinhalte).

# profitankkarte.de · Motion-Design-Video

Erklärvideo für die Website **profitankkarte.de** (tankpool24-Karte von team).
Ziel: **Anfragen über das Kontaktformular.** Das ganze Video läuft auf einen einzigen Call-to-Action zu.

## Ergebnis

| Datei | Zweck |
|---|---|
| `output/profitankkarte-1080p.mp4` | 1920×1080, 30 fps, H.264 + AAC, 48 s · Desktop |
| `output/profitankkarte-720p.mp4` | 1280×720 · Mobil, kleinere Datei |
| `output/profitankkarte-poster.jpg` | Posterbild (Endcard) für `<video poster>` |
| `output/profitankkarte-storyboard.pdf` | Storyboard mit 9 Schlüsselbildern zur Freigabe beim Kunden |
| `embed/snippet.html` | Einbindung mit klickbarem CTA auf der Endcard + Tracking |
| `audio/soundtrack.wav` | Musik + Sounddesign, −16 LUFS |

## Dramaturgie

Aufbau: Problem → Lösung → drei Säulen der Website (Konditionen, Sicherheit, Kostenkontrolle) → Netz und Services → Frage an den Zuschauer → Formular → Endcard.
Schnitte liegen auf einem 120-BPM-Raster, Musik und Effekte sind framegenau synchron.

| Zeit | Szene | Text im Bild | Bild |
|---|---|---|---|
| 0–4 s | Hook | Ihr Fuhrpark tankt jeden Tag. · Da zählt jeder **Cent** pro Liter. | Zapfsäulen-Display, Betrag und Liter laufen |
| 4–8 s | Lösung | tankpool24-Karte von team · **Die Tankkarte für Profis.** · Für Fuhrpark, Spedition und Logistik. | Unterstrich wird zur roten Fläche, 3D-Karte fliegt ein |
| 8–14 s | Individuelle Konditionen | Bis zu **4 ct** pro Liter Diesel sparen. · Rechenbeispiel: 250.000 Liter × 4 ct = **10.000 €** | Ziffern-Roll, Zähler |
| 14–19 s | Tanknetz | **2.200** Stationen. · 24 Stunden europaweit tanken. | Europa als Punktraster, Stationen leuchten ab Flensburg auf |
| 19–25 s | Maximale Sicherheit | Eine der sichersten Tankkarten der Welt. · amtliche Fahrerkarte · Kartensperre im Kundenportal · Videoauswertung an den Stationen | Schild, Fahrerkarte, Scan, Haken |
| 25–30 s | Volle Kostenkontrolle | Alles im Blick. · Karten bestellen und sperren, Transaktionen jederzeit einsehen: im Online-Kundenportal. | Portal-Mockup, Karte wird per Klick gesperrt |
| 30–35 s | Services | Mehr als Tanken. · Pannenhilfe 24/7 · Park Your Truck · Mautservice · Dieselinspektor · HVO100 (ca. 90 % weniger CO₂) · E-Laden | Kacheln mit Icons |
| 35–43 s | CTA | **Wie viel spart Ihr Fuhrpark?** · Ihr individuelles Angebot anfordern. · Kostenlos und unverbindlich · Persönlicher Ansprechpartner | Kontaktformular füllt sich aus, „Anfrage gesendet" |
| 43–48 s | Endcard | tankpool24-Karte von team · **profitankkarte.de** · Die Tankkarte für Profis. · **Jetzt Kontaktformular ausfüllen** · Kostenlos und unverbindlich | Roter Button wird zur Fläche, die zur roten Linie der Endcard wird |

Bewusste Entscheidungen für die Conversion:
- **Ein einziger CTA** (Kontaktformular). Die 0800-Nummer ist absichtlich nicht im Video, damit es keine zweite Handlungsoption gibt.
- Die Frage „Wie viel spart Ihr Fuhrpark?" schlägt die Brücke vom Rechenbeispiel zum individuellen Angebot.
- Das Formular wird im Video vorgeführt: Es zeigt, wie wenig Aufwand die Anfrage ist.
- Risiko-Umkehr direkt am CTA: „Kostenlos und unverbindlich".
- Funktioniert komplett **ohne Ton** (Autoplay auf Websites ist immer stumm).

## Markenregeln team tankpool24 (aus `supabase/seed.sql`)

- [x] Markenname „tankpool24-Karte von team", „team" immer klein, nie „tp24"
- [x] Kein Gedankenstrich (—) im Bildtext
- [x] Nie „Bezahlkarte", keine Referenzkunden (Formular nutzt „Muster Logistik GmbH")
- [x] „2.200 Stationen", HVO100 „ca. 90 %", Laden „an nahezu allen Ladepunkten in Deutschland"
- [x] Schwarz/weiß entsättigt, Rot #E31E24 als einziger Akzent (im Video gemessen: 226/29/36)
- [x] B100, Ökostrom, Schmierstoffe kommen nicht vor
- [x] Keine Logos nachgebaut (team- und tankpool24-Logo nie mischen): Die Wortmarke ist die Domain in der Hausschrift Barlow

## Vor der Veröffentlichung prüfen

Die Website war aus der Produktionsumgebung nicht direkt abrufbar. Die Fakten stammen aus Suchergebnissen
zu profitankkarte.de, team.de und tankpool24.eu sowie aus dem Content-Plan im Planner. Bitte mit team abstimmen:

1. „Bis zu 4 Cent pro Liter Diesel" bei individuellen Konditionen
2. Rechenbeispiel 250.000 l × 4 ct = 10.000 € (im Video als Beispielrechnung gekennzeichnet)
3. „24 Stunden europaweit tanken" (Seitentitel tankpool24 auf team.de)
4. „Eine der sichersten Tankkarten der Welt" sowie Kartensperre im Kundenportal und Videoauswertung
5. Services: Pannenhilfe 24/7 europaweit, Park Your Truck, Mautservice „Eine Box für 15 Länder", Dieselinspektor
6. Ziel des Buttons: Anker oder URL des Kontaktformulars (`data-contact` im Snippet, Standard `#kontakt`)

Die Europakarte ist eine Illustration: Die roten Punkte zeigen die Dichte des Netzes (Schwerpunkt Deutschland), keine echten Standorte.

## Einbindung auf der Website

`embed/snippet.html` als HTML-Block einfügen und die vier `data-…`-Werte anpassen:
`data-video-desktop` (1080p), `data-video-mobile` (720p), `data-poster` und `data-contact` (Anker oder URL des Formulars).

- Startet stumm, sobald das Video zur Hälfte sichtbar ist, pausiert beim Wegscrollen
- Lädt auf Bildschirmen bis 900 px die 720p-Datei
- Auf der Endcard liegt ein echter, klickbarer Button über dem Video-Button und führt zum Formular
- Ton-Schalter, „Nochmal ansehen", berücksichtigt „Bewegung reduzieren"
- Tracking-Events für den Google Tag Manager (`dataLayer`): `ptk_video_start`, `ptk_video_complete`, `ptk_video_cta_click`, `ptk_video_unmute`

Empfehlung: Video selbst hosten (nicht als YouTube-Embed, das zeigt am Ende fremde Videos und führt Klicks von der Seite weg)
und direkt oberhalb des Kontaktformulars oder im Hero mit Anker zum Formular platzieren.

## Texte ändern und neu rendern

Voraussetzungen: Node 20+, ffmpeg, Python 3 mit `numpy` und `scipy`, Chromium für Playwright.

```bash
cd motion/profitankkarte
npm install
npm run preview                 # Live-Vorschau: http://localhost:4173/src/index.html (Leertaste, Pfeiltasten)
npm run stills -- 12.5 40       # Standbilder bei 12,5 s und 40 s nach .tmp/
npm run cues && npm run audio   # Soundtrack neu erzeugen (nach Timing-Änderungen)
npm run render                  # finale Videos + Poster nach output/ (ca. 10 Minuten)
npm run render -- --from 8 --to 14   # nur einen Ausschnitt rendern
npm run storyboard              # Storyboard-PDF aus dem fertigen Video
```

| Was | Wo |
|---|---|
| Texte | `src/index.html`, pro Szene kommentiert |
| Timing und Animation | `src/main.js` (Szenenplan `T`, 120 BPM) |
| Farben, Typografie, Layout | `src/styles.css` |
| Karte | `scripts/build-map.mjs` → `src/data/europe-dots.json` (`npm run map`) |
| Musik und Sounddesign | `scripts/audio.py` |

Technik: HTML/CSS-Komposition mit GSAP, deterministisch Frame für Frame gerendert (Playwright → ffmpeg),
Bewegungsunschärfe über einen 180°-Shutter mit 4 bis 16 Subframes pro Bild.

## Ton

Eigene Komposition, komplett synthetisiert (keine Samples, keine Lizenzkosten): 120 BPM, A-Moll (Am, F, C, G), Schluss in C-Dur.
Das Sounddesign hängt an Cues aus der Animation (Wischer wandern im Stereobild mit, Zähler, Tippen, Klick, Impact).
Lautheit −16 LUFS, True Peak unter −1,5 dBTP.

# BMW Motorrad Martin – Website-Redesign

Neuentwicklung von motorrad-martin.de als eigenständiges Projekt. Die bestehende Live-Website wurde nicht verändert; alle Inhalte wurden von ihr übernommen, nichts wurde erfunden.

```bash
npm install
npm run dev       # Entwicklung: http://localhost:4321
npm run build     # statischer Build nach dist/ (beim ersten Mal ~2 min Bildoptimierung, danach Cache)
npm run preview   # Build lokal ansehen
```

---

## Konzept: das Typenschild

**Die Idee.** Jedes Motorrad trägt ein Typenschild: eingeprägte Daten, exakt bündig, nichts Überflüssiges. Martin baut Einzelstücke, also wird die ganze Website wie ein Typenschild gesetzt.

**Typografie.** Eine einzige variable Grotesk (Archivo, Breitenachse 62–125 %) und eine Mono-Schrift (IBM Plex Mono) für alles, was gezählt, gemessen oder verbaut wird.

- Jede große Schlagzeile wird per Skript Zeile für Zeile auf die exakte Spaltenbreite gesetzt (`src/scripts/fit.ts`). Dafür wird die Breite der Buchstaben verändert, nicht nur die Größe, wie bei einer Prägung.
- Bei Hover dehnen sich Titel in die Breite, statt die Farbe zu wechseln.

**Farbe.**
- Zwei Welten: Papier (Haus und Service) und Graphit (Manufaktur).
- Keine Markenfarbe als Fläche.
- Jede Martin Edition bringt ihre eigene Signaturfarbe mit, aus dem Foto abgeleitet (Daytona-Orange, Hunter-Oliv, Dakar-Rot). Sie färbt Katalognummer, Akzentzeile und Hover-Linie.

**Bildsprache.** Die Fotos der Martin Edition (Darren Jacklin) sind das stärkste Kapital der Marke und tragen die Seite. Es gibt keine Stockfotos und keine KI-Bilder.

**Bewegung.** Bewegung gibt es nur dort, wo sie etwas erzählt:

- **Das Tor (Startseite):** Das Bildfenster unter der Schlagzeile öffnet sich beim Scrollen zur ganzen Bühne, wie ein Hallentor.
- **Die Manufaktur-Galerie:** Am Desktop ist sie an den Scroll gekoppelt, mobil wischt man nativ.
- **Bild-Einblendungen:** Bilder werden beim Einblenden aufgedeckt, Schlagzeilen schieben sich Zeile für Zeile aus der Maske.
- **Seitenübergänge:** Sie laufen über View Transitions. Das Bild einer Edition wandert aus der Übersicht in die Detailseite.
- **Reduzierte Bewegung:** Bei „Bewegung reduzieren“ entfällt alles davon. Ohne JavaScript ist jede Seite vollständig lesbar und bedienbar.

**Was es so noch nicht gibt.** Diese Elemente sind mehr als Gestaltung, sie nehmen Kundinnen und Kunden Arbeit ab:

| Element | Wofür |
|---|---|
| **Live-Öffnungsstatus** je Haus („Schongau öffnet morgen 8:00“) | Wird nach Europe/Berlin berechnet, inklusive Mittagspause und der unterschiedlichen Winterregeln der drei Häuser. Er stimmt also auch für Besucher aus dem Ausland. |
| **„Mein Haus“** | Einmal gewählt, richten sich Kopfzeile, Anruf-Knopf, Formulare und Kontaktseite nach diesem Haus. Gespeichert wird nur lokal im Browser, es gibt keinen Server und kein Tracking. |
| **Revierkarte** | Eine schematische Karte des Alpenrands, aus echten Koordinaten projiziert. Sie zeigt die drei Häuser, ihre Luftlinien-Abstände und beim Überfahren das Einzugsgebiet. Es gibt keinen Kartendienst und keine Fremdanfrage. |
| **Maßband 1954 – heute** | Die Firmengeschichte als Skala: ein Teilstrich pro Jahr. |
| **Miet-Preisrechner** | Rechnet ausschließlich mit den veröffentlichten Tarifen (Stand 20.05.2026): 3-Tages- und Wochenpauschale, Probefahrtenpauschale, Mehrkilometer, Koffer, Navi und Reinigung. |
| **Katalog-Register** der Martin Edition | Filter nach Baureihe und eine Umschaltung zwischen Tafel- und Register-Ansicht. Im Register folgt eine Bildvorschau dem Mauszeiger. |

## Seitenstruktur

| Bereich | Seiten |
|---|---|
| Start | `/` |
| Manufaktur | `/martin-edition/` mit 23 Detailseiten `/martin-edition/<edition>/` |
| Motorräder | `/motorraeder/` (Neuheiten, Modellpflege) · `/gebrauchte/` mit Bestand je Haus und 10 Modell-Ratgebern · `/gebrauchte/pkw/` · `/ankauf/` (dreistufig) · `/mieten/` |
| Service | `/service/` (Werkstatt) · `/service/winter-wellness/` · `/service/bmw-classic/` · `/service/bekleidung-zubehoer/` |
| Haus | `/standorte/` mit 3 Hausseiten (Team, Zeiten, Anfahrt, Stellen) · `/ueber-uns/` · `/journal/` mit 21 Beiträgen · `/karriere/` mit 9 Stellen · `/kontakt/` |
| Recht | `/impressum/` · `/datenschutz/` · `404` |

Insgesamt sind es 88 Seiten plus 128 Weiterleitungen von alten Adressen.

Die bisherige Navigation (Standorte, News, Events, Gebrauchte, Ankauf, Motorräder, Kontakt mit insgesamt 26 Unterpunkten) ist nach dem geordnet, was Besucher tun wollen:

- **Kaufen:** Martin Edition, Motorräder, Gebrauchte.
- **Fahren:** Mieten.
- **Erhalten:** Service.
- **Finden:** Standorte.

„Events“ (auf der alten Seite leer) und „Racing“ sind ins Journal gewandert.

## Technik

- **[Astro](https://astro.build) 7, vollständig statisch:** Kein Server, kein CMS und keine Datenbank nötig. Gehostet werden kann auf jedem Webspace, Netlify, Cloudflare Pages oder Vercel.
- **Inhalte als Markdown-Collections** in `src/content/`: `journal`, `jobs`, `modelle`, `recht`. Das Schema prüft sie beim Build.
- **Strukturierte Daten** in `src/data/`: Standorte inkl. Öffnungszeiten, Editionen, Mietpreise, Team, Chronik, Navigation. Öffnungszeiten werden genau einmal gepflegt und speisen Fußzeile, Hausseiten, Live-Status und schema.org.
- **Bilder** in `src/assets/` werden beim Build automatisch in AVIF (mit JPG-Rückfall) und in passenden Breiten ausgegeben, Lazy Loading inklusive.
- **Schriften selbst gehostet:** Es gibt keine Verbindung zu Google Fonts.
- **JavaScript:** etwa 55 KB gzip, davon GSAP/ScrollTrigger und Lenis für die Scroll-Bewegung. Alles ist Progressive Enhancement.
- **SEO:**
  - Eigener Titel und eigene Beschreibung je Seite, Canonical, Open-Graph-Bild je Seite, Sitemap.
  - JSON-LD: `MotorcycleDealer` je Haus mit Öffnungszeiten, `Motorcycle` je Edition, `JobPosting`, `FAQPage`, `Article`, `BreadcrumbList`.
- **Barrierefreiheit:**
  - Sprunglink, sichtbare Fokuszustände, echte `<dialog>`-Elemente mit Fokusführung und Escape.
  - Formulare mit deutschen Fehlermeldungen und `aria-invalid`.
  - „Bewegung reduzieren“ wird respektiert, die Status-Texte sind vorlesbar.

```
src/
  pages/        eine Datei je Seite bzw. Seitentyp ([slug].astro)
  components/   Kopfzeile, Fuß, Fit (Typenschild-Satz), Karte, Massband, Anfrage …
  content/      Markdown-Inhalte (aus der alten Seite importiert)
  data/         Standorte, Editionen, Miete, Team, Chronik, Weiterleitungen
  scripts/      app.ts (Bewegung, Dialoge, Filter), fit.ts, status.ts, formular.ts, miete.ts
  styles/       global.css – Design-Tokens und Grundbausteine
  assets/       Fotos und Schriften
scripts/import/ einmalige Import-Skripte (Inhalte und Bildauswahl von der alten Seite)
tests/          Funktionsprüfung mit Playwright
```

## Inhalte pflegen

- **Neuer Journal-Beitrag:** eine Markdown-Datei in `src/content/journal/` mit Kopfdaten wie in den vorhandenen Dateien (`kategorie`, `cover`, `reihenfolge` …).
- **Neue Stelle:** eine Datei in `src/content/jobs/`. Die Seite, der Eintrag auf der Hausseite und das JobPosting-Schema entstehen automatisch.
- **Neue Edition:** einen Eintrag in `src/data/editionen.ts` anlegen und die Bilder unter `src/assets/editionen/<slug>-1.jpg` (bzw. `-2.jpg`) ablegen.
- **Öffnungszeiten oder Winterregel:** `src/data/standorte.ts`, dort `zeiten` für die Berechnung und `zeitenText` für die Anzeige.
- **Mietpreise:** `src/data/miete.ts`.

## Formulare

Ohne Konfiguration öffnet jedes Formular eine vorbereitete E-Mail an das gewählte Haus. Es wird nichts vorgetäuscht und nichts geht verloren. Für echten Versand genügt ein Formular-Endpunkt (z. B. Formspree, Netlify Forms, eigener Server), der `multipart/form-data` annimmt:

```bash
PUBLIC_FORM_ENDPOINT=https://… npm run build
```

Der Ankauf schickt dann auch die Fotos mit. Formulare lassen sich per URL vorbelegen, z. B. `/kontakt/?anliegen=probefahrt&fahrzeug=BMW%20R%2012%20G%2FS&haus=weyarn`. Die Editions-, Miet- und Modellseiten nutzen das bereits.

## Weiterleitungen der alten Adressen

Alle 128 bekannten Joomla-Adressen (`/index.php/…`) zeigen auf die passende neue Seite. Die Liste steht in `src/data/weiterleitungen.json`, jedes Ziel ist gegen den Build geprüft.

- **Statischer Build:** Astro erzeugt dafür Weiterleitungsseiten. Sie funktionieren überall, sind aber keine echten 301.
- **Netlify / Cloudflare Pages:** `public/_redirects` liefert echte 301.
- **Apache / nginx:** dieselbe Liste als Rewrite-Regeln übernehmen.

## Vercel

- **Projekt:** `motorrad-martin` im Team `luisnl-5533s-projects`, erreichbar unter https://motorrad-martin.vercel.app.
- **Neu deployen:** aus diesem Ordner mit `npx vercel deploy --prod`. `vercel.json` enthält die 301-Weiterleitungen der alten Adressen, Cache-Header für `/_astro/` und `trailingSlash`.
- **Vorschau-Modus:** Im Vercel-Projekt ist `PUBLIC_NOINDEX=1` gesetzt. Dadurch tragen alle Seiten `noindex, nofollow`, und `robots.txt` sperrt Crawler aus, damit die Vorschau nicht mit motorrad-martin.de konkurriert. Für den echten Livegang wird die Variable entfernt.
- **Zugriffsschutz:** Die Vercel-Authentifizierung ist aktiv, nur eingeloggte Team-Mitglieder sehen die Seite. Für einen öffentlichen Link wird sie unter Settings → Deployment Protection abgeschaltet.
- **Keine Git-Verknüpfung:** Das Projekt ist bewusst nicht mit dem Repository verbunden. Pushes lösen also keine Builds aus.

## Prüfung

```bash
npm run build && npm run preview &
npm i -D playwright && DIST=./dist node tests/pruefung.cjs
```

Geprüft wird Folgendes:

- **Alle Seiten** in drei Breiten (390 / 820 / 1440 px): keine Konsolenfehler, kein horizontales Überlaufen, genau eine H1, jede Typenschild-Zeile bündig.
- **Navigation:** Menü und Hauswahl samt Fokus und Escape, „Mein Haus“ über Seiten hinweg.
- **Formulare:** Formularprüfung und E-Mail-Versand, dazu der Ankauf mit seinen drei Stufen.
- **Mietrechner:** sechs Rechenfälle.
- **Edition:** Filter, Ansichtswechsel und die Bildvorschau im Register.
- **Sonderfälle:** reduzierte Bewegung und Betrieb ohne JavaScript.
- **Öffnungsstatus** zu fünf festen Zeitpunkten, darunter Mittagspause, Wintermontag und Samstag in Schongau, und für einen Besucher aus New York.

Beim letzten Lauf bestanden alle 42 Prüfungen. Interne Links: 2.632 geprüft, 0 tot.

---

## Vor dem Livegang zu klären

Diese Punkte konnten nicht aus der bestehenden Website beantwortet werden. Sie wurden bewusst nicht erfunden.

1. **Datenschutzerklärung und Impressum** sind wörtlich von der alten Seite übernommen. Die neue Seite unterscheidet sich technisch:
   - kein Cookie-Plugin, keine Statistik, Schriften lokal;
   - mobile.de- und Racing-Einbettungen laden erst nach Klick;
   - „Mein Haus“ wird im `localStorage` gespeichert;
   - Formulare laufen per E-Mail bzw. über einen späteren Endpunkt.

   Die Texte sollten juristisch an die neue Seite angepasst werden. Ein Cookie-Banner ist nach aktuellem Stand nicht nötig; das bitte bestätigen lassen.
2. **Winterzeiten Weyarn:** Für Montage im Oktober und März ist auf der alten Seite keine Zeit angegeben, hinterlegt sind die Winter-Werktagszeiten (9–12 und 13–18 Uhr). Bitte bestätigen.
3. **Bildrechte:** Die Edition-Fotos stammen von Darren Jacklin, die Neuheiten-Fotos von der BMW Group Presse. Die Nutzung im Redesign bitte mit den bestehenden Lizenzen abgleichen.
4. **Gebrauchtbestand:** Er wird wie bisher über mobile.de eingebettet. Für eine eigene, filterbare Bestandsliste mit Martin-Edition-Filter und „Probefahrt für genau diese Maschine“ empfiehlt sich die mobile.de-Händler-Schnittstelle; das Design ist dafür vorbereitet.
5. **Formular-Endpunkt** festlegen (siehe oben). Bis dahin läuft alles per E-Mail.
6. **Auszeichnungen:** Laut Recherche hat Martin unter anderem den World-of-Bike-Preis „Händler des Jahres 2020“ und den BMW Motorrad Award 2025 „Kundenzufriedenheit Service“ (Weyarn) erhalten. Beides ist auf der Seite noch **nicht** erwähnt, weil die Quellen nicht direkt abrufbar waren. Nach Bestätigung lassen sich die Preise prominent auf der Startseite und den Hausseiten platzieren.
7. **Selbstbeschreibungen** wie „einer der größten BMW Motorrad Händler“ und „nummeriertes Unikat“ stammen von der bisherigen Website und wurden unverändert übernommen.

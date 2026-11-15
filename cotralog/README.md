# cotralog – Homepage

Statische Seite ohne Build-Schritt: HTML, ein Stylesheet, ein Skript, zwei selbst gehostete Schriftdateien.
Es werden keine externen Ressourcen geladen, keine Cookies gesetzt und keine Analysedienste eingebunden.

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `index.html` | Startseite mit allen Inhalten |
| `impressum.html`, `datenschutz.html` | Platzhalterseiten, vor Veröffentlichung auszufüllen |
| `404.html` | Fehlerseite |
| `assets/css/site.css` | Gestaltung, Druckansicht, reduzierte Bewegung |
| `assets/js/site.js` | Menü, Modulverzeichnis, Einstiegsgrafik, Formular |
| `assets/fonts/` | Newsreader (Überschriften) und Hanken Grotesk (Text), beide SIL Open Font License, siehe `OFL.txt` |
| `assets/img/` | Logo, Favicon, Touch-Icon, Vorschaubild für geteilte Links |
| `vercel.json` | Cache- und Sicherheits-Header für Vercel |

## Lokal ansehen

```bash
cd cotralog
python3 -m http.server 4173
# http://localhost:4173
```

## Änderungen an Gestaltung oder Logo

Stylesheet, Skript und Bilder sind in den HTML-Dateien mit `?v=10` eingebunden. Nach einer Änderung
an diesen Dateien die Zahl in allen vier HTML-Dateien erhöhen, damit Browser die neue Fassung laden.

## Veröffentlichen

Der Ordner `cotralog/` ist das Wurzelverzeichnis der Seite. Bei Vercel als eigenes Projekt
anlegen, „Root Directory" auf `cotralog` setzen, Framework „Other", kein Build-Befehl.

## Offene Platzhalter

Im Code jeweils mit `PLATZHALTER` markiert.

1. **Kontaktweg für das Testangebot.** In `index.html` am Formular `data-endpoint` (und `action`)
   auf die Versandadresse setzen. Das Skript sendet die Felder `name`, `unternehmen`, `email`,
   `telefon`, `nachricht` per POST und erwartet einen Erfolgsstatus (2xx). Solange kein Ziel
   eingetragen ist, zeigt das Formular einen Platzhalterhinweis und überträgt nichts.
2. **E-Mail-Adresse und Telefonnummer** im Abschnitt „Testangebot" (Liste `class="direct"`).
3. **Impressum und Datenschutzerklärung.** Beide Seiten enthalten nur gekennzeichnete Platzhalter.
4. **Domain.** In `index.html` `canonical` und `og:url` ergänzen und `og:image` als absolute Adresse eintragen.
5. **Logo.** Das Logo stammt aus der Kopfzeile der Word-Textvorlage (PNG, 545 × 179 px,
   `assets/img/cotralog-logo.png`). Für die Endfassung bitte durch eine Vektordatei (SVG) ersetzen.
   Favicon und Touch-Icon zeigen das Sonnensymbol aus dem Logo; liegt ein eigenes Bildzeichen vor,
   ersetzt es `favicon-32.png`, `favicon-48.png` und `apple-touch-icon.png`.

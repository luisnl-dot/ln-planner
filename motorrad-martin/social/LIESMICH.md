# Instagram-Startpaket · BMW Motorrad Martin

Konzept und Umsetzung: LN Social · Stand November 2026

## Inhalt

| Ordner | Was | Format |
| --- | --- | --- |
| `export/feed-4x5/` | 9 Posts, davon 2 Karussells (16 Bilder) | 1080 × 1350 JPG |
| `export/stories-9x16/` | 5 Story-Vorlagen | 1080 × 1920 JPG |
| `export/reels-9x16/` | 3 Reels mit Titelbild | 1080 × 1920 MP4, 30 fps |
| `export/profil-und-highlights/` | Profilbild und 6 Highlight-Cover | 1080 × 1080 PNG |
| `export/profil/` | Schematische Vorschau des Profils | PNG |
| `TEXTE.md` | Bio, Bildunterschriften, Hashtags, Redaktionsplan, Drehpläne, Kennzahlen, Sorgfalt | Text |
| `vorlagen/` | Alle Vorlagen als HTML zum Weiterbauen | HTML/CSS |

## Präsentation

`export/praesentation/martin-instagram-praesentation.html` ist eine einzige Datei mit allen Schriften, Fotos und Reels. Sie läuft per Doppelklick im Browser, auch ohne Internet.

- **Blättern:** → / Leertaste oder Klick rechts, ← oder Klick links, auf dem Handy wischen.
- **O oder Esc:** Übersicht · **N:** Sprechernotizen · **F:** Vollbild · **?:** Hilfe.
- **Drucken → Als PDF sichern:** eine Folie pro Seite (die fertige PDF liegt daneben).
- **Neu bauen:** `python3 social/praesentation/bauen.py` (Quelle: `social/praesentation/vorlage.html`).

## Neue Beiträge aus den Vorlagen bauen

Voraussetzung ist das Website-Projekt mit `npm install`. Die Vorlagen nutzen dessen Schriften und Fotos.

1. Text oder Foto in `vorlagen/posts.html` bzw. `stories.html` ändern oder einen Block kopieren. Jeder `<section class="karte" data-name="…">` wird ein Bild.
2. `node social/render.cjs`: rendert alle Bilder nach `export/`.
3. `node social/reel.cjs reel-lichtkante.html`: rendert ein Reel, Bild für Bild, zu MP4 (braucht ffmpeg).

Die Schlagzeilen setzen sich automatisch über die volle Breite, wie auf der Website.

## Vor dem Posten prüfen

Alles, was in `TEXTE.md` mit **[Prüfen]** markiert ist: Winter-Preise, Probefahrt-Vorführer, Einwilligungen von Personen, Öffnungszeiten zwischen den Jahren.

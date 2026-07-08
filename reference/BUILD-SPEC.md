# LN Social — Build-Spec für Claude Code

**Ziel:** Ein System, das dein Business + deine Kunden kennt, on-brand Social-Media-Posts erzeugt, alles in einem mobilen Planner speichert — und (später) per WhatsApp bedienbar ist.

Dieses Dokument ist die Bauanleitung. Du lädst es oben in Claude Code rein und arbeitest die Phasen der Reihe nach ab. Jede Phase hat einen fertigen Prompt zum Kopieren.

---

## 0. Große Linie (was wir bauen)

Drei Schichten, klar getrennt:

1. **Gehirn** — deine Wahrheit über Business + Kunden (Regeln, Fakten, Ton). Existiert bereits als Obsidian-Vault `Claude-Gehirn`. Wird ins System eingespeist.
2. **Planner** — mobile Web-App (PWA). Kunden, Redaktionsplan, Fotos, Post-Entwürfe. Prototyp steht schon live auf Vercel und dient als Design-Vorlage.
3. **KI-Generierung** — erzeugt Captions/Ideen **strikt nach den Kundenregeln** aus dem Gehirn.
4. **Design-Engine** — rendert aus den Captions **fertige, on-brand Bild-Posts** über feste Templates (kein freies AI-Bild, sondern Markenvorlagen, die die KI mit Text füllt).
5. **WhatsApp-Bot** (letzte Phase, optional) — derselbe Motor, nur über WhatsApp bedienbar; liefert Caption **und** gerendertes Bild direkt in den Chat.

**Grundprinzip:** Der WhatsApp-Bot ist nur ein Eingang. Der Wert steckt in Gehirn + Planner + KI. Deshalb bauen wir in dieser Reihenfolge — WhatsApp zuletzt.

---

## 1. Tech-Stack (dein Standard)

- **Frontend/Backend:** Next.js 14 (App Router, kein `src/`), TypeScript, Tailwind
- **Datenbank + Auth + Storage:** Supabase (Postgres, Fotos in Supabase Storage)
- **KI:** Anthropic Claude API (`claude-sonnet-5` für Generierung; günstig + on-brand)
- **Deployment:** Vercel + GitHub (steht schon)
- **WhatsApp:** Meta WhatsApp Cloud API (nur Phase 4)

Warum Supabase statt localStorage: Damit deine Kunden, Posts und Fotos **zentral** gespeichert sind und auf jedem Gerät gleich aussehen — nicht nur im Browser eines Handys.

---

## 2. Datenmodell (Supabase)

```
clients
  id            uuid pk
  name          text            -- "Greek Food Olympia"
  handle        text            -- "@greekfoodolympia"
  emoji         text
  branche       text
  cta           text            -- Standard-CTA
  voice         text            -- Markenstimme (Fließtext aus dem Vault)
  hard_rules    text[]          -- nicht verhandelbare Regeln (je 1 Eintrag)
  hashtags_fix  text[]          -- fixe Hashtag-Sets
  facts         text            -- verifizierte Fakten (Fließtext)
  created_at    timestamptz default now()

posts
  id            uuid pk
  client_id     uuid fk -> clients.id
  date          date
  time          text
  format        text            -- Feed / Story / Reel / Carousel
  theme         text            -- Wochen-Thema / Winkel
  caption       text
  status        text            -- Neu / Entwurf / Freigabe / Geplant / Live
  created_at    timestamptz default now()

photos
  id            uuid pk
  post_id       uuid fk -> posts.id (nullable)
  client_id     uuid fk -> clients.id
  storage_path  text            -- Pfad in Supabase Storage
  created_at    timestamptz default now()
```

Die Felder `voice`, `hard_rules`, `hashtags_fix`, `facts` sind das, was die KI beim Generieren als Kontext bekommt. Sie kommen 1:1 aus deinen Vault-Notizen.

---

## 3. Das Gehirn einspeisen (Vault → Datenbank)

Deine Kundennotizen in `Claude-Gehirn/Kunden/` sind schon perfekt strukturiert. Für v1 wird der Inhalt **einmalig als Seed** in die `clients`-Tabelle geschrieben. Konkret für die zwei Startkunden:

**Greek Food Olympia** — `hard_rules`:
- du-Form, atmosphärisch, Dreiteilung, schließt mit „Willkommen im GFO."
- Kein Em-Dash (—)
- Max. 6–8 Hashtags, `..` + Zeilenumbruch vor dem Hashtag-Block
- Fixe Hashtags: #greekfoodolympia #berlindining #berlinrestaurants #moderncuisine #greekbutdifferent #dinnerexperience
- Feed nur Sonntag 18:00; Business Lunch 19,90 € / 3 Gänge / Mo–Fr 11:45–14:30

**tankpool24 team energie** — `hard_rules`:
- Markenname „tankpool24-Karte von team" — nie „team Mobility Card"
- „team" immer klein; nie „tp24" öffentlich
- Kein Em-Dash; immer „Link in Bio 👆"
- Karte nie als „Bezahlkarte"; keine Referenzkunden namentlich
- Schmierstoff-Hausmarke oilfino; Partner Mobil/ExxonMobil (nicht Total)
- Ladeabdeckung „nahezu allen Ladepunkten in Deutschland" — nie „99%"
- Ökostrom = aus Wasserkraft; B100 Biodiesel nicht im Sortiment (nie nennen)
- Immer „2.200 Stationen"; HVO100 „ca. 90%" CO₂-Reduktion
- Design: schwarz/weiß entsättigt, rot #E31E24 einziger Akzent

> Später kann ein kleiner Sync-Script die `.md`-Dateien automatisch parsen und upserten. Für v1 reicht der manuelle Seed — er ändert sich selten.

---

## 4. Phasen mit Copy-Prompts für Claude Code

### Phase 1 — Projekt-Gerüst + Datenbank

```
Erstelle ein neues Next.js 14 Projekt (App Router, TypeScript, Tailwind, kein src/-Ordner).
Richte Supabase als Backend ein (@supabase/supabase-js, Auth optional single-user).
Lege die Tabellen clients, posts, photos gemäß dem Datenmodell in BUILD-SPEC.md an
(schreibe eine SQL-Migration). Aktiviere Supabase Storage-Bucket "photos".
Env-Variablen: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
Deploybar auf Vercel. Mobile-first. Design exakt wie der Prototyp in index.html
(clean, schwarz/weiß, leichte Farbakzente) — nutze index.html als visuelle Referenz.
```

### Phase 2 — Planner-UI auf echte Daten

```
Baue die Planner-Oberfläche aus index.html als React-Komponenten nach, aber lies/schreibe
alle Daten aus Supabase statt localStorage: Kunden-Tabs, Agenda-Liste + Kalender-Umschalter,
Bottom-Sheet zum Anlegen/Bearbeiten von Posts, Status-Dots (Neu/Entwurf/Freigabe/Geplant/Live),
"+ Kunde", Foto-Upload in den Storage-Bucket mit Vorschau. Mobile-first, PWA (manifest + Icons
schon vorhanden). Seede die zwei Startkunden Greek Food Olympia und tankpool24 mit den
hard_rules/hashtags aus BUILD-SPEC.md Abschnitt 3.
```

### Phase 3 — Echte KI-Generierung

```
Baue eine API-Route /api/generate (Next.js Route Handler). Input: client_id, format, theme.
Ablauf: Lade den Kunden aus Supabase, baue einen System-Prompt der voice, facts,
hashtags_fix und ALLE hard_rules als strikte Constraints enthält, rufe die Anthropic
Claude API (claude-sonnet-5) und gib 3 Caption-Vorschläge zurück, die JEDE hard_rule einhalten.
Env: ANTHROPIC_API_KEY. Im Planner: Button "Generieren" im Post-Sheet ruft die Route auf,
zeigt die 3 Vorschläge, einer per Tap übernehmbar ins caption-Feld. Baue eine
Validierungs-Schicht: prüfe die Ausgabe gegen einfache Regeln (z.B. kein "—", verbotene
Begriffe) und markiere Verstöße sichtbar.
```

### Phase 4 — Design-Engine (fertige Bild-Posts aus Templates)

**Prinzip (wichtig):** Das ist **kein** freies AI-Bild. Es sind feste Markenvorlagen (HTML/CSS), die die KI mit Text (und optional einem Foto) füllt. Genau so macht es das Fiona-Beispiel: die Vorlage steht, der Inhalt wird eingesetzt, das Bild wird serverseitig gerendert. Dadurch bleibt es 100 % on-brand und reproduzierbar.

**Technik:** `@vercel/og` bzw. Satori (React/HTML → SVG → PNG). Läuft direkt als Next.js-Route auf Vercel, keine externe Bilder-API nötig, kein Puppeteer/Headless-Chrome. Ausgabe: PNG 1080×1080 (Feed) bzw. 1080×1920 (Story).

**Brand-Tokens pro Kunde** (neue Spalte `design` jsonb in `clients`, ODER eigene Tabelle `templates`):
```
design (jsonb) je Kunde:
  bg            "#0A0A0A"   Hintergrund
  fg            "#FFFFFF"   Text
  accent        "#E31E24"   einziger Akzent (tankpool24: rot; GFO: dezent gold/weiß)
  font_head     Schriftname Headline
  font_body     Schriftname Fließtext
  logo_path     Storage-Pfad Logo (weiß/schwarz)
  photo_treatment  "entsättigt" | "farbe"   Fotobehandlung
```
Damit erbt jedes Template automatisch die Kundenoptik — schwarz/weiß-entsättigt + rot für tankpool24, ruhig/atmosphärisch für GFO.

**Drei Start-Templates** (decken beide Kunden ab):

1. **`statement`** — großes Zitat/Statement auf Markenfläche. Headline groß, Kundenlogo klein unten, optional Foto als entsättigter Hintergrund mit Abdunklung. *GFO:* atmosphärisches Zitat übers Essen. *tankpool24:* starke Aussage („2.200 Stationen. Eine Karte.").
2. **`tipp`** — Fehler/Tipp-Post wie im Fiona-Screenshot. Kleiner Kicker oben („TIPP" / „GUT ZU WISSEN"), Headline, 1–3 Zeilen Erklärung, CTA-Zeile unten. Ideal für Wissens-/Utility-Content (tankpool24: HVO100, Ladeabdeckung; GFO: Business-Lunch-Zeiten).
3. **`angebot`** — Angebot/Aktion. Foto oben (Storage), unten Balken mit Titel + Preis/Detail + CTA. *GFO:* Business Lunch 19,90 € / 3 Gänge. *tankpool24:* Feature-Highlight.

**Copy-Prompt für Claude Code:**
```
Baue eine Design-Engine mit @vercel/og (Satori) als Next.js-Route /api/render.
Input: client_id, template ("statement" | "tipp" | "angebot"), Textfelder (headline,
body, cta, preis…), optional photo_path aus Supabase Storage.
Ablauf: lade den Kunden inkl. design-Tokens (neue jsonb-Spalte "design" in clients,
per Migration ergänzen + für GFO und tankpool24 seeden), rendere das gewählte Template
mit den Brand-Tokens (bg/fg/accent/fonts/logo, Foto entsättigt falls photo_treatment),
gib ein PNG zurück (Feed 1080×1080, Story 1080×1920).
Baue die 3 Templates statement/tipp/angebot wie in BUILD-SPEC Abschnitt 4/Phase 4.
Im Planner: nach dem Caption-Generieren ein Button "Bild erzeugen" → wählt Template,
füllt Felder aus der Caption vor, zeigt Live-Vorschau, speichert das PNG in den
Storage-Bucket und verknüpft es mit dem Post (photos-Tabelle).
Wichtig: tankpool24 nur rot #E31E24 als Akzent, sonst schwarz/weiß entsättigt;
team-Logo und tankpool24-Logo nie mischen. GFO ruhig/atmosphärisch, kein Em-Dash im Bildtext.
```

> Reihenfolge-Tipp: Erst die Caption-Engine (Phase 3, fertig) liefert den Text, dann füllt die Design-Engine damit das Template. So ist der Bild-Text automatisch schon regelkonform — dieselben `hard_rules` gelten.

### Phase 5 — WhatsApp-Bot (optional, siehe Abschnitt 5 zuerst lesen)

```
Baue einen WhatsApp-Webhook (Next.js Route /api/whatsapp) für die Meta Cloud API.
Verifiziere den Webhook (GET mit hub.challenge). Bei eingehender Nachricht wie
"7er Story für tankpool": erkenne Kunde + Format + Anzahl, rufe intern die gleiche
Generierungs-Logik wie /api/generate (Caption) und danach /api/render (Bild),
lege die Posts als Entwurf in Supabase an, und antworte im Chat mit der Caption
UND dem gerenderten Bild + einem Link zum Planner-Eintrag.
Nur meine eigene Nummer whitelisten. Env: WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_VERIFY_TOKEN.
```

---

## 5. WhatsApp — ehrlicher Realitäts-Check (vor Phase 5 lesen)

Das ist der aufwändigste Teil. Was du brauchst und was es kostet:

**Voraussetzungen:**
- Meta-Business-Account + **Business-Verifizierung** (Meta prüft: Gewerbe-/Handelsregister, Adresse, Website müssen exakt übereinstimmen). Dauer: 10 Minuten bis 14 Werktage.
- Eine dedizierte Telefonnummer für WhatsApp Business (nicht deine private).
- Der Webhook muss 24/7 erreichbar sein — läuft aber ohnehin auf Vercel.

**Kosten (Stand 2026):** Abrechnung erfolgt seit Juli 2025 **pro Nachricht**, nicht mehr pro Gespräch. Kategorien: Marketing (teuerste, ~1–14 ct je Zielland), Utility/Authentication (deutlich günstiger), **Service = kostenlos** innerhalb des 24-Stunden-Fensters nachdem *du* dem Bot schreibst. Für deinen Fall (du schreibst dem Bot, er antwortet dir) bist du fast immer im **kostenlosen Service-Fenster** — also praktisch keine Nachrichtenkosten. Der Aufwand liegt nicht im Geld, sondern in Verifizierung + Einrichtung.

**Empfehlung:** Phase 5 erst starten, wenn Phasen 1–4 laufen und du den Planner täglich nutzt. Wenn dir das Tippen im Planner reicht, kannst du WhatsApp auch ganz weglassen — es ist Komfort, kein Kernnutzen. Der „designte Post"-Moment (wie im Fiona-Screenshot) steckt in **Phase 4**, nicht in WhatsApp.

---

## 6. Accounts & Keys — Checkliste

| Was | Wofür | Kosten |
|---|---|---|
| GitHub | Code-Repo | kostenlos (hast du) |
| Vercel | Hosting | kostenlos Hobby (hast du) |
| Supabase | Datenbank + Foto-Speicher | kostenlos bis ~500 MB, dann günstig |
| Anthropic API Key | KI-Generierung | pay-per-use, wenige ct pro Post |
| Meta Business + WhatsApp | nur Phase 4 | Setup-Aufwand, Nachrichten quasi gratis |

---

## 7. Reihenfolge — kurz

1. Phase 1+2: Planner läuft auf echter Datenbank, geräteübergreifend. **← größter Sprung** *(fertig)*
2. Phase 3: KI erzeugt regelkonforme Captions direkt im Planner. *(fertig)*
3. Phase 4: Design-Engine — aus der Caption wird ein fertiger, on-brand Bild-Post. **← der „Fiona-Moment"**
4. Phase 5: WhatsApp obendrauf — Caption + Bild direkt im Chat, nur wenn gewünscht.

Nach jeder Phase: auf Vercel deployen, auf dem Handy testen, dann weiter.

---

*Quelle Kundenregeln: Obsidian-Vault `Claude-Gehirn` · Design-Referenz: `index.html` (Prototyp) · Stand Juli 2026*

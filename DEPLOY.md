# LN Planner — Live schalten (10 Min)

Statische PWA. Kein Build nötig. Ordner pushen → in Vercel importieren → auf dem Handy installieren.

## 1. GitHub-Repo anlegen
1. github.com → **New repository** → Name z.B. `ln-planner` → **Private** → *Create*.
2. Diesen Ordner (`content-planner/`) als Repo pushen. Im Terminal in diesem Ordner:

```bash
git init
git add .
git commit -m "LN Planner v1"
git branch -M main
git remote add origin https://github.com/DEIN-NAME/ln-planner.git
git push -u origin main
```

## 2. In Vercel deployen
1. vercel.com → **Add New… → Project** → GitHub-Repo `ln-planner` **Import**.
2. Framework Preset: **Other** (es ist statisch). Root/Build/Output einfach leer lassen.
3. **Deploy**. Nach ~30 Sek. bekommst du eine Live-URL (`ln-planner.vercel.app`).

## 3. Eigene Domain (planner.luisnl.de)
1. Vercel-Projekt → **Settings → Domains** → `planner.luisnl.de` eintragen.
2. Vercel zeigt einen CNAME-Eintrag. Den bei deinem Domain-Anbieter (luisnl.de) unter DNS hinzufügen:
   - Type **CNAME**, Name **planner**, Value **cname.vercel-dns.com**
3. Nach DNS-Propagation (Minuten bis 1 Std.) ist `planner.luisnl.de` live.

## 4. Aufs Handy als App
- iPhone Safari: `planner.luisnl.de` öffnen → **Teilen** → **Zum Home-Bildschirm**.
- Öffnet dann Vollbild wie eine echte App (Icon „LN").

## Updates später
Datei ändern → committen → `git push`. Vercel deployt automatisch neu.

---
**Hinweis Datenspeicher:** v1 speichert Kunden/Posts/Fotos lokal im Browser (localStorage) — läuft sofort, aber pro Gerät. Geräteübergreifende Synchronisation + „speichert alles zentral" kommt im nächsten Schritt (Datenbank via Supabase).

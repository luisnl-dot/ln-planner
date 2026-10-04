// Storyboard zur Freigabe: 9 Schlüsselbilder aus dem fertigen Video mit Timecode und Text.
// Aufruf (nach npm run render): node scripts/storyboard.mjs
//   → output/profitankkarte-storyboard.pdf und .png
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "./serve.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const video = join(root, "output", "profitankkarte-1080p.mp4");
const dir = join(root, ".tmp", "storyboard");
mkdirSync(dir, { recursive: true });

const SHOTS = [
  [3.3, "Hook", "Ihr Fuhrpark tankt jeden Tag. Da zählt jeder Cent pro Liter."],
  [6.6, "Lösung", "Die Tankkarte für Profis. tankpool24-Karte von team"],
  [12.6, "Individuelle Konditionen", "Bis zu 4 ct pro Liter Diesel sparen. Rechenbeispiel 10.000 €"],
  [17.6, "Tanknetz", "2.200 Stationen. 24 Stunden europaweit tanken."],
  [23.0, "Maximale Sicherheit", "Eine der sichersten Tankkarten der Welt."],
  [28.6, "Volle Kostenkontrolle", "Alles im Blick. Im Online-Kundenportal."],
  [33.5, "Services", "Mehr als Tanken. Pannenhilfe, Parken, Maut, Dieselinspektor, HVO100, E-Laden"],
  [41.2, "Call-to-Action", "Wie viel spart Ihr Fuhrpark? Ihr individuelles Angebot anfordern."],
  [47.5, "Endcard", "profitankkarte.de · Jetzt Kontaktformular ausfüllen · Kostenlos und unverbindlich"],
];

const tc = (t) => `0:${String(Math.floor(t)).padStart(2, "0")}`;
SHOTS.forEach(([t], i) => {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", String(t), "-i", video, "-frames:v", "1", "-vf", "scale=960:-2", "-q:v", "2", join(dir, `shot-${i}.jpg`)]);
});

const cards = SHOTS.map(
  ([t, title, copy], i) => `
  <figure>
    <img src="shot-${i}.jpg" alt="">
    <figcaption><b>${String(i + 1).padStart(2, "0")} · ${title}</b><span>${tc(t)}</span><p>${copy}</p></figcaption>
  </figure>`,
).join("");

writeFileSync(
  join(dir, "index.html"),
  `<!doctype html><html lang="de"><head><meta charset="utf-8">
<link rel="stylesheet" href="/node_modules/@fontsource/barlow/500.css">
<link rel="stylesheet" href="/node_modules/@fontsource/barlow/700.css">
<link rel="stylesheet" href="/node_modules/@fontsource/barlow/800.css">
<style>
  @page { size: 420mm 297mm; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; width: 1680px; padding: 56px 64px; font-family: Barlow, sans-serif; color: #0B0B0C; background: #F3F3F0; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #0B0B0C; padding-bottom: 18px; margin-bottom: 30px; }
  h1 { margin: 0; font-size: 44px; font-weight: 800; letter-spacing: -0.01em; }
  h1 em { font-style: normal; color: #E31E24; }
  header p { margin: 0; font-size: 18px; color: #5A5A60; text-align: right; line-height: 1.4; }
  main { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px 24px; }
  figure { margin: 0; }
  img { display: block; width: 100%; border-radius: 10px; box-shadow: 0 10px 30px -12px rgba(0,0,0,.35); }
  figcaption { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; margin-top: 12px; }
  figcaption b { font-size: 19px; font-weight: 700; }
  figcaption span { font-size: 17px; font-weight: 700; color: #E31E24; }
  figcaption p { grid-column: 1 / -1; margin: 0; font-size: 16px; line-height: 1.35; color: #5A5A60; }
  footer { margin-top: 30px; padding-top: 16px; border-top: 1px solid #D8D8D4; font-size: 15px; color: #5A5A60; display: flex; justify-content: space-between; }
</style></head><body>
<header>
  <h1>profitankkarte.de · Motion-Design-Video<em>.</em></h1>
  <p>Ziel: Anfragen über das Kontaktformular<br>48 s · 16:9 · 1920×1080 · Musik und Sounddesign synchron, funktioniert auch stumm</p>
</header>
<main>${cards}</main>
<footer><span>tankpool24-Karte von team · Markenregeln: schwarz/weiß, Rot #E31E24 als einziger Akzent, kein Gedankenstrich, „team“ klein</span><span>Storyboard zur Freigabe</span></footer>
</body></html>`,
);

const { server, port } = await startServer();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1680, height: 1190 }, deviceScaleFactor: 1.5 });
await page.goto(`http://127.0.0.1:${port}/.tmp/storyboard/index.html`);
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => [...document.images].every((i) => i.complete));
await page.screenshot({ path: join(root, "output", "profitankkarte-storyboard.png"), fullPage: true });
await page.pdf({ path: join(root, "output", "profitankkarte-storyboard.pdf"), width: "1680px", height: `${await page.evaluate(() => document.body.scrollHeight)}px`, printBackground: true });
await browser.close();
server.close();
console.log("→ output/profitankkarte-storyboard.pdf / .png");

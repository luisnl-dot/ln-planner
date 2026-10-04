// Rendert Standbilder zu bestimmten Zeitpunkten (Review/Kontaktabzug).
// Aufruf: node scripts/stills.mjs 2.5 6 10.4   →  .tmp/still-2.50.png ...
//         node scripts/stills.mjs --sheet       →  Kontaktabzug über die ganze Länge
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { startServer } from "./serve.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, ".tmp");
mkdirSync(out, { recursive: true });

const args = process.argv.slice(2);
const sheet = args.includes("--sheet");
let times = args.filter((a) => !a.startsWith("--")).map(Number);

const { server, port } = await startServer();
const browser = await chromium.launch({ args: ["--font-render-hinting=none", "--force-color-profile=srgb"] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on("console", (m) => console.log("[page]", m.text()));
page.on("pageerror", (e) => console.error("[pageerror]", e.message));
await page.goto(`http://127.0.0.1:${port}/src/index.html?render`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
const duration = await page.evaluate(() => window.__duration);
if (sheet) times = Array.from({ length: Math.floor(duration / 1) }, (_, i) => i + 0.5);

const files = [];
for (const t of times) {
  await page.evaluate((tt) => window.__seek(tt), t);
  const file = join(out, `still-${t.toFixed(2)}.png`);
  await page.screenshot({ path: file });
  files.push(file);
}
writeFileSync(join(out, "cues.json"), JSON.stringify(await page.evaluate(() => window.__cues), null, 1));
await browser.close();
server.close();

if (sheet) {
  // 6 Spalten, Thumbnails 320x180, mit Zeitstempel
  const cols = 6;
  const list = files.map((f) => `file '${f}'`).join("\n");
  writeFileSync(join(out, "sheet.txt"), list);
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", join(out, "sheet.txt"),
    "-vf", `scale=320:180,tile=${cols}x${Math.ceil(files.length / cols)}:padding=4:color=white`,
    "-frames:v", "1", join(out, "sheet.png"),
  ]);
  console.log("Kontaktabzug:", join(out, "sheet.png"));
} else {
  console.log(files.join("\n"));
}

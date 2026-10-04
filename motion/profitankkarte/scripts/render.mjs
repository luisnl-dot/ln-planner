// Rendert die Komposition deterministisch Frame für Frame (Playwright → sharp → ffmpeg).
// Bewegungsunschärfe: pro Ausgabe-Frame werden Subframes über einen 180°-Shutter gemittelt,
// in schnellen Übergängen (window.__fast) mit deutlich mehr Subframes.
//
//   node scripts/render.mjs                      → output/profitankkarte-1080p.mp4 (+ 720p, Poster)
//   node scripts/render.mjs --from 8 --to 14     → nur ein Ausschnitt (Review)
//   node scripts/render.mjs --sub 1 --fast 1     → schnell, ohne Bewegungsunschärfe
//
// Ton: liegt audio/soundtrack.wav vor (npm run audio), wird er automatisch eingemischt.
import { chromium } from "playwright";
import sharp from "sharp";
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { cpus } from "node:os";
import { startServer } from "./serve.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const W = 1920;
const H = 1080;
const FPS = Number(arg("fps", 30));
const SUB = Number(arg("sub", 4)); // Subframes pro Frame (normal)
const SUB_FAST = Number(arg("fast", 16)); // Subframes in schnellen Übergängen
const SHUTTER = Number(arg("shutter", 0.5)); // 0.5 = 180°
const WORKERS = Number(arg("workers", Math.max(1, cpus().length)));
const NAME = arg("name", "profitankkarte");
const tmp = join(root, ".frames");
const outDir = join(root, "output");
mkdirSync(tmp, { recursive: true });
mkdirSync(outDir, { recursive: true });
mkdirSync(join(root, "audio"), { recursive: true });
sharp.concurrency(1);

const { server, port } = await startServer();
const url = `http://127.0.0.1:${port}/src/index.html?render`;
const LAUNCH = { args: ["--font-render-hinting=none", "--force-color-profile=srgb", "--disable-lcd-text"] };

// Dauer, Cues und schnelle Zeitfenster aus der Seite lesen
const probe = await chromium.launch(LAUNCH);
const probePage = await probe.newPage({ viewport: { width: W, height: H } });
await probePage.goto(url);
await probePage.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
const { duration, cues, fast } = await probePage.evaluate(() => ({ duration: window.__duration, cues: window.__cues, fast: window.__fast }));
writeFileSync(join(root, "audio", "cues.json"), JSON.stringify({ duration, cues }, null, 1));
await probe.close();
if (process.argv.includes("--cues-only")) {
  server.close();
  console.log("→ audio/cues.json");
  process.exit(0);
}

const from = Number(arg("from", 0));
const to = Number(arg("to", duration));
const f0 = Math.round(from * FPS);
const f1 = Math.round(to * FPS);
const total = f1 - f0;
const subsFor = (f) => {
  const a = f / FPS;
  const b = (f + SHUTTER) / FPS;
  return fast.some(([x, y]) => a < y && b > x) ? Math.max(SUB, SUB_FAST) : SUB;
};
// Frames so auf Worker verteilen, dass jeder etwa gleich viele Subframes bekommt
const cost = Array.from({ length: total }, (_, i) => subsFor(f0 + i));
const totalCost = cost.reduce((a, b) => a + b, 0);
const ranges = [];
{
  let start = 0;
  let acc = 0;
  for (let i = 0; i < total; i++) {
    acc += cost[i];
    if (acc >= (totalCost / WORKERS) * (ranges.length + 1) && ranges.length < WORKERS - 1) {
      ranges.push([f0 + start, f0 + i + 1]);
      start = i + 1;
    }
  }
  ranges.push([f0 + start, f1]);
}
console.log(`Render ${from}s → ${to}s · ${total} Frames @ ${FPS} fps · ${totalCost} Subframes · ${WORKERS} Worker`);

const started = Date.now();
let done = 0;
async function worker([a, b], w) {
  if (a >= b) return null;
  const seg = join(tmp, `seg-${String(w).padStart(2, "0")}.mkv`);
  const ff = spawn("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264rgb", "-preset", "veryfast", "-crf", "4", seg,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const closed = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg ${c}`)))));

  const browser = await chromium.launch(LAUNCH);
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.error(`[w${w}]`, e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  const cdp = await page.context().newCDPSession(page);
  const acc = new Uint32Array(W * H * 3);
  const out = Buffer.alloc(W * H * 3);
  for (let f = a; f < b; f++) {
    const n = subsFor(f);
    const decodes = [];
    for (let k = 0; k < n; k++) {
      const t = (f + (n > 1 ? (k / n) * SHUTTER : 0)) / FPS;
      await page.evaluate((tt) => window.__seek(tt), t);
      const { data } = await cdp.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true });
      decodes.push(sharp(Buffer.from(data, "base64")).removeAlpha().raw().toBuffer());
    }
    acc.fill(0);
    for (const px of await Promise.all(decodes)) for (let i = 0; i < px.length; i++) acc[i] += px[i];
    const half = n >> 1;
    for (let i = 0; i < out.length; i++) out[i] = ((acc[i] + half) / n) | 0;
    if (!ff.stdin.write(out)) await new Promise((r) => ff.stdin.once("drain", r));
    done++;
    if (done % 60 === 0) {
      const el = (Date.now() - started) / 1000;
      console.log(`  ${done}/${total} Frames · ${el.toFixed(0)} s · ETA ${((el / done) * (total - done)).toFixed(0)} s`);
    }
  }
  ff.stdin.end();
  await closed;
  await browser.close();
  return seg;
}

const segs = (await Promise.all(ranges.map((r, w) => worker(r, w)))).filter(Boolean);
server.close();
writeFileSync(join(tmp, "segs.txt"), segs.map((s) => `file '${s}'`).join("\n"));
const master = join(tmp, "master.mkv");
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", join(tmp, "segs.txt"), "-c", "copy", master]);
console.log(`Frames fertig in ${((Date.now() - started) / 1000).toFixed(0)} s`);

// Finale Web-Encodes: RGB → BT.709 (TV-Range) explizit, damit Rot #E31E24 exakt bleibt
const audio = join(root, "audio", "soundtrack.wav");
const hasAudio = existsSync(audio) && !process.argv.includes("--mute");
const partial = from > 0 || to < duration;
const suffix = partial ? `-${from}-${to}s` : "";
const enc = (height, crf, maxrate, file) => {
  const args = ["-y", "-loglevel", "error", "-i", master];
  if (hasAudio) args.push("-ss", String(from), "-t", String(to - from), "-i", audio);
  args.push(
    "-vf", `scale=-2:${height}:flags=lanczos+accurate_rnd+full_chroma_int:out_color_matrix=bt709:out_range=tv,format=yuv420p`,
    "-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-crf", String(crf),
    "-maxrate", maxrate, "-bufsize", "10M", "-g", String(FPS * 2), "-tune", "animation",
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv",
    "-movflags", "+faststart",
  );
  if (hasAudio) args.push("-map", "0:v:0", "-map", "1:a:0", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-shortest");
  args.push(file);
  execFileSync("ffmpeg", args);
  console.log("→", file);
};
enc(1080, 20, "6M", join(outDir, `${NAME}-1080p${suffix}.mp4`));
if (!partial) {
  enc(720, 22, "3M", join(outDir, `${NAME}-720p.mp4`));
  // Poster = Endcard (für <video poster>)
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-sseof", "-0.4", "-i", master, "-frames:v", "1", "-q:v", "2", join(outDir, `${NAME}-poster.jpg`)]);
  console.log("→", join(outDir, `${NAME}-poster.jpg`));
}
if (!process.argv.includes("--keep")) rmSync(tmp, { recursive: true, force: true });

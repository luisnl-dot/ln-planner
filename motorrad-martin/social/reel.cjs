// Rendert ein Reel Bild für Bild (GSAP-Zeitleiste wird für jedes Bild exakt angesteuert)
// und setzt es mit ffmpeg zu einem MP4 (H.264, 1080×1920, 30 fps) zusammen.
// Aufruf aus motorrad-martin/:  node social/reel.cjs reel-lichtkante.html [weitere …]
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const FPS = 30;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const ziel = path.join(__dirname, 'export', 'reels-9x16');
  fs.mkdirSync(ziel, { recursive: true });
  for (const datei of process.argv.slice(2)) {
    const name = datei.replace(/\.html$/, '');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-'));
    await p.goto('file://' + path.join(__dirname, 'vorlagen', datei));
    await p.waitForFunction(() => window.reelBereit === true, null, { timeout: 30000 });
    const dauer = await p.evaluate(() => window.DAUER);
    const n = Math.round(dauer * FPS);
    const shot = (datei, q = 93) => p.screenshot({ path: datei, type: 'jpeg', quality: q, clip: { x: 0, y: 0, width: 1080, height: 1920 } });
    for (let i = 0; i < n; i++) {
      await p.evaluate((t) => { window.zeige(t); }, i / FPS);
      await shot(path.join(tmp, `${String(i).padStart(5, '0')}.jpg`));
    }
    const mp4 = path.join(ziel, `${name}.mp4`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(tmp, '%05d.jpg'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
    // Titelbild (Cover) aus dem Moment, an dem alles steht
    const cover = await p.evaluate(() => window.COVER ?? window.DAUER * 0.62);
    await p.evaluate((t) => { window.zeige(t); }, cover);
    await shot(path.join(ziel, `${name}-cover.jpg`), 94);
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(path.relative(path.join(__dirname, '..'), mp4), `${dauer.toFixed(1)} s, ${n} Bilder`);
  }
  await b.close();
})();

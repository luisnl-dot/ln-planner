// Scroll-Messung: scrollt Seiten per Mausrad durch (CPU vierfach gedrosselt) und misst die
// Arbeit im Hauptprozess (Zeichnen, Layout, Stil, Skript) pro Sekunde sowie lange Aufgaben.
// Aufruf: npm run build && npm run preview, dann
//   node tests/scrollmessung.cjs [basis-url] [pfad …]
// Richtwerte (gedrosselt): unter ~550 ms/s und 0 lange Aufgaben (> 50 ms).
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ARTEN = ['Paint', 'Layout', 'UpdateLayoutTree', 'Layerize', 'PrePaint', 'FunctionCall', 'ScrollLayer'];
const STANDARD = ['/', '/martin-edition/', '/martin-edition/r-1300-gs-adventure-hunter/', '/motorraeder/', '/gebrauchte/', '/service/', '/mieten/', '/ankauf/', '/standorte/', '/standorte/weyarn/', '/ueber-uns/', '/journal/', '/karriere/', '/kontakt/'];

async function miss(b, url) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1000);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.mouse.move(720, 450);
  const datei = path.join(os.tmpdir(), `scrollmessung-${Date.now()}.json`);
  await b.startTracing(p, { path: datei, categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline'] });
  const t0 = Date.now();
  for (let i = 0; i < 400; i++) {
    await p.mouse.wheel(0, 90);
    await p.waitForTimeout(16);
    if (i % 15 === 14 && (await p.evaluate(() => scrollY >= document.documentElement.scrollHeight - innerHeight - 2))) break;
  }
  await p.waitForTimeout(500);
  const s = (Date.now() - t0) / 1000;
  await b.stopTracing();
  await ctx.close();
  const ev = JSON.parse(fs.readFileSync(datei, 'utf8')).traceEvents.filter((e) => e.ph === 'X' && e.dur);
  fs.unlinkSync(datei);
  const summe = ARTEN.reduce((x, a) => x + ev.filter((e) => e.name === a).reduce((y, e) => y + e.dur, 0) / 1000, 0);
  return { msProS: summe / s, lang: ev.filter((e) => e.name === 'RunTask' && e.dur > 50000).length };
}

(async () => {
  const [basis = 'http://127.0.0.1:4321', ...pfade] = process.argv.slice(2);
  const b = await chromium.launch();
  for (const pfad of pfade.length ? pfade : STANDARD) {
    const r = await miss(b, basis + pfad);
    console.log(`${pfad.padEnd(48)} ${r.msProS.toFixed(0).padStart(4)} ms/s   lange Aufgaben: ${r.lang}`);
  }
  await b.close();
})();

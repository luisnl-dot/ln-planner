// Rendert alle Vorlagen (jede <section class="karte" data-name>) als fertige Bilddateien.
// Aufruf aus motorrad-martin/:  node social/render.cjs [vorlage.html …]
// Ausgabe: social/export/<ordner>/<data-name>.jpg (Fotos) bzw. .png (data-format="png")
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const VORLAGEN = {
  'posts.html': 'feed-4x5',
  'stories.html': 'stories-9x16',
  'symbole.html': 'profil-und-highlights',
};

(async () => {
  const wahl = process.argv.slice(2);
  const liste = wahl.length ? wahl : Object.keys(VORLAGEN);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 1400 }, deviceScaleFactor: 1 });
  for (const datei of liste) {
    const ordner = path.join(__dirname, 'export', VORLAGEN[datei] || datei.replace('.html', ''));
    fs.mkdirSync(ordner, { recursive: true });
    await p.goto('file://' + path.join(__dirname, 'vorlagen', datei));
    await p.evaluate(() => window.bereit);
    await p.waitForTimeout(300);
    const karten = await p.$$('section.karte[data-name]');
    for (const k of karten) {
      const name = await k.getAttribute('data-name');
      const fmt = (await k.getAttribute('data-format')) || 'jpg';
      const ziel = path.join(ordner, `${name}.${fmt}`);
      await k.screenshot(fmt === 'png' ? { path: ziel, type: 'png' } : { path: ziel, type: 'jpeg', quality: 94 });
      console.log(path.relative(path.join(__dirname, '..'), ziel));
    }
  }
  await b.close();
})();

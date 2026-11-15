// Funktionsprüfung gegen die laufende Vorschau (npm run build && npm run preview).
// Aufruf: DIST=./dist node tests/pruefung.cjs  – benötigt Playwright (npm i -D playwright).
const { chromium } = require('playwright');
const fs = require('fs');
const B = 'http://127.0.0.1:4321';
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  → ' + extra : '')); };

(async () => {
  const browser = await chromium.launch();

  // ---------- 1. every page: console errors + horizontal overflow at 3 widths ----------
  const paths = [];
  const walk = (d, base = '') => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { if (f.isDirectory()) { if (f.name !== '_astro') walk(d + '/' + f.name, base + '/' + f.name); } else if (f.name === 'index.html') paths.push(base + '/'); } };
  walk(process.env.DIST);
  const problems = [];
  for (const [w, h] of [[390, 844], [820, 1180], [1440, 900]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: 'de-DE', timezoneId: 'Europe/Berlin', hasTouch: w < 900, isMobile: w < 800 });
    const page = await ctx.newPage();
    let errs = [];
    page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
    for (const p of paths) {
      errs = [];
      await page.goto(B + p, { waitUntil: 'load' });
      await page.waitForFunction(() => window.__mmBereit === true, null, { timeout: 8000 }).catch(() => errs.push('never ready'));
      const r = await page.evaluate(() => {
        const d = document.documentElement;
        const fits = [...document.querySelectorAll('.fit')].flatMap((f) => [...f.querySelectorAll('.fit__satz')].filter((s) => getComputedStyle(s).display !== 'none').flatMap((s) => [...s.querySelectorAll('.fit__line')].map((l) => Math.round((l.getBoundingClientRect().width - f.clientWidth) * 10) / 10)));
        return { over: d.scrollWidth - d.clientWidth, fits, h1: document.querySelectorAll('h1').length, title: document.title.length, desc: (document.querySelector('meta[name=description]')?.content || '').length };
      });
      const badFit = r.fits.filter((x) => x > 0.6 || x < -3);
      if (r.over > 0 || errs.length || badFit.length || r.h1 !== 1 || !r.desc) problems.push(`${w}px ${p} over=${r.over} h1=${r.h1} badFit=${JSON.stringify(badFit)} ${errs.slice(0, 2).join(' | ')}`);
    }
    await ctx.close();
  }
  ok(`all ${paths.length} pages × 3 viewports: no console errors, no overflow, 1 h1, headline lines flush`, problems.length === 0, problems.slice(0, 12).join('\n      '));

  // ---------- 2. interactions (desktop) ----------
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'de-DE', timezoneId: 'Europe/Berlin' });
  const page = await ctx.newPage();
  await page.goto(B + '/', { waitUntil: 'networkidle' });

  await page.click('[data-dialog-oeffnen="menue"]');
  await page.waitForTimeout(900);
  ok('menu opens as modal dialog', await page.evaluate(() => document.getElementById('menue').open && document.getElementById('menue').matches(':modal')));
  ok('menu: focus is inside dialog', await page.evaluate(() => document.getElementById('menue').contains(document.activeElement)));
  await page.keyboard.press('Escape'); await page.waitForTimeout(900);
  ok('menu closes on Escape', await page.evaluate(() => !document.getElementById('menue').open));
  ok('menu button aria-expanded reset', await page.getAttribute('.kopfzeile [data-dialog-oeffnen="menue"]', 'aria-expanded') === 'false');

  await page.click('.kopfzeile [data-hauswahl-oeffnen]'); await page.waitForTimeout(800);
  ok('house picker opens', await page.evaluate(() => document.getElementById('hauswahl').open));
  await page.click('#hauswahl [data-haus-merken="schongau"]'); await page.waitForTimeout(200);
  ok('house remembered in localStorage', await page.evaluate(() => localStorage.getItem('mm:haus')) === 'schongau');
  const head = await page.textContent('.kopfzeile [data-status="auto"] [data-status-text]');
  ok('header status switches to remembered house', /^Schongau/.test(head), head);
  await page.keyboard.press('Escape'); await page.waitForTimeout(700);
  await page.goto(B + '/kontakt/', { waitUntil: 'networkidle' });
  ok('contact form preselects remembered house', await page.inputValue('#anfrage-form-haus') === 'schongau');
  ok('contact page marks remembered house', await page.evaluate(() => document.querySelector('.kon__haeuser [data-mein-haus="schongau"]').hasAttribute('data-ist-mein')));

  // form validation + prepared e-mail
  await page.goto(B + '/kontakt/?anliegen=werkstatt&fahrzeug=BMW%20R%201300%20GS', { waitUntil: 'networkidle' });
  ok('form prefill from URL (anliegen)', await page.inputValue('#anfrage-form-anliegen') === 'werkstatt');
  ok('form prefill from URL (fahrzeug)', await page.inputValue('#anfrage-form-fahrzeug') === 'BMW R 1300 GS');
  await page.click('#anfrage-form [type=submit]'); await page.waitForTimeout(200);
  const errCount = await page.locator('#anfrage-form .feld__fehler').count();
  ok('empty submit shows German field errors', errCount >= 3, errCount + ' errors');
  ok('first invalid field focused + aria-invalid', await page.evaluate(() => document.activeElement.getAttribute('aria-invalid') === 'true'));
  await page.fill('#anfrage-form-name', 'Test Fahrer'); await page.fill('#anfrage-form-email', 'test@example.org'); await page.fill('#anfrage-form-nachricht', 'Inspektion fällig.');
  await page.check('#anfrage-form [name=einwilligung]');
  // capture the prepared mail link instead of handing it to the OS
  await page.evaluate(() => document.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('a[data-vorbereitet]'); if (a) { window.__mail = a.href; e.preventDefault(); } }, true));
  await page.click('#anfrage-form [type=submit]'); await page.waitForTimeout(300);
  const mail = await page.evaluate(() => window.__mail || null);
  ok('valid submit opens prepared e-mail to the chosen house', !!mail && mail.startsWith('mailto:info-sog@motorrad-martin.de') && decodeURIComponent(mail).includes('Werkstatt-Termin') && decodeURIComponent(mail).includes('Inspektion fällig.'), mail ? decodeURIComponent(mail).slice(0, 150).replace(/\n/g, ' ⏎ ') : 'no mailto request seen');
  ok('status message shown after submit', await page.locator('#anfrage-form [data-meldung]').isVisible());

  // rental calculator
  await page.goto(B + '/mieten/', { waitUntil: 'networkidle' });
  const sum = () => page.textContent('[data-r-summe]');
  ok('rental: R 1300 GS · 1 day = 189 + 25', (await sum()).replace(/\s/g, '') === '214€', await sum());
  await page.check('input[name=dauer][value="3"]');
  ok('rental: 3-day flat = 2 × 189 + 25', (await sum()).replace(/\s/g, '') === '403€', await sum());
  await page.check('input[name=dauer][value="7"]');
  ok('rental: week flat = 5 × 189 + 25', (await sum()).replace(/\s/g, '') === '970€', await sum());
  await page.check('[data-r-koffer]'); await page.check('[data-r-navi]');
  ok('rental: week + cases (7×6=42) + navi (flat 60)', (await sum()).replace(/\s/g, '') === '1.072€', await sum());
  await page.fill('[data-r-km]', '2000');
  ok('rental: +200 extra km × 0,70', (await sum()).replace(/\s/g, '') === '1.212€', await sum());
  await page.selectOption('[data-r-modell]', 'M 1000 RR'); await page.check('input[name=dauer][value="halb"]'); await page.uncheck('[data-r-koffer]'); await page.uncheck('[data-r-navi]');
  ok('rental: M 1000 RR half day = 179,50 + 25', (await sum()).replace(/\s/g, '') === '204,50€', await sum());
  ok('rental: M model shows age note + 5.000 € excess', /ab 23 Jahren/.test(await page.textContent('[data-r-fuss]')) && /5\.000/.test(await page.textContent('[data-r-fuss]')));

  // edition filter + view switch
  await page.goto(B + '/martin-edition/', { waitUntil: 'networkidle' });
  await page.click('[data-filter="familie"] [data-wert="R 18"]'); await page.waitForTimeout(700);
  ok('edition filter: R 18 shows 1 card', await page.locator('.tafeln > li:not([hidden])').count() === 1);
  ok('edition filter: counter updated', (await page.textContent('[data-filter-zahl="familie"]')) === '01');
  await page.click('[data-filter="familie"] [data-wert="alle"]'); await page.waitForTimeout(700);
  ok('edition filter: reset shows 23', await page.locator('.tafeln > li:not([hidden])').count() === 23);
  await page.click('[data-ansicht="register"]'); await page.waitForTimeout(300);
  ok('view switch: register visible, cards hidden', await page.locator('.register').isVisible() && !(await page.locator('.tafeln').isVisible()));
  await page.hover('.register [data-zeile="r-18-bobber"] a'); await page.waitForTimeout(500);
  ok('register: hover preview follows pointer', await page.evaluate(() => document.querySelector('.register__vorschau').classList.contains('ist-sichtbar') && document.querySelector('[data-vorschau-bild="r-18-bobber"]').classList.contains('ist-aktiv')));

  // trade-in steps
  await page.goto(B + '/ankauf/', { waitUntil: 'networkidle' });
  await page.click('[data-stufe-weiter]'); await page.waitForTimeout(200);
  ok('trade-in: cannot skip step 1 with empty required fields', await page.locator('[data-stufe="1"]').isVisible());
  await page.fill('#a-modell', 'BMW R 1250 GS'); await page.fill('#a-ez', '2021-04'); await page.fill('#a-km', '18500');
  await page.click('[data-stufe-weiter]'); await page.waitForTimeout(600);
  ok('trade-in: advances to step 2', await page.locator('[data-stufe="2"]').isVisible() && !(await page.locator('[data-stufe="1"]').isVisible()));
  ok('trade-in: progress marker updated', await page.getAttribute('[data-stufe-marke="2"]', 'aria-current') === 'step');
  await page.click('[data-stufe-zurueck]'); await page.waitForTimeout(400);
  ok('trade-in: back keeps entered values', await page.inputValue('#a-modell') === 'BMW R 1250 GS');

  // skip link
  await page.goto(B + '/service/', { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  ok('skip link is first focus target', await page.evaluate(() => document.activeElement.classList.contains('skip')));
  await ctx.close();

  // ---------- 2b. home hero: light sweep ----------
  const lkx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const lkp = await lkx.newPage();
  await lkp.goto(B + '/', { waitUntil: 'networkidle' }); await lkp.waitForTimeout(2600);
  ok('home hero: stage completely black after load', await lkp.evaluate(() => {
    const lk = document.querySelector('[data-lk]');
    const x = Math.max(parseFloat(getComputedStyle(lk).getPropertyValue('--a')) || 0, parseFloat(getComputedStyle(lk).getPropertyValue('--b')) || 0);
    const aus = (e) => getComputedStyle(e).visibility === 'hidden' || getComputedStyle(e).opacity === '0';
    return x === 0 && [...lk.querySelectorAll('[data-lk-licht]')].every(aus);
  }));
  await lkp.evaluate(() => window.scrollTo(0, 900)); await lkp.waitForTimeout(1400);
  ok('home hero: pinned, fully lit and caption shown after scroll', await lkp.evaluate(() => {
    const lk = document.querySelector('[data-lk]');
    const b = parseFloat(getComputedStyle(lk).getPropertyValue('--b'));
    return lk.parentElement.classList.contains('pin-spacer') && b > 99 && getComputedStyle(lk.querySelector('[data-lk-etikett]')).visibility === 'visible';
  }));
  // Die festgehaltene Galerie darf erst starten, wenn der Auftakt vorbei ist (Reihenfolge der Pins)
  for (const [w, h] of [[1440, 900], [1280, 800], [1920, 1080]]) {
    await lkp.setViewportSize({ width: w, height: h });
    await lkp.goto(B + '/', { waitUntil: 'networkidle' }); await lkp.waitForTimeout(1200);
    const oben = await lkp.evaluate(() => { const g = document.querySelector('.schau'); return g.getBoundingClientRect().top + scrollY; });
    await lkp.evaluate((y) => window.scrollTo(0, y - 200), oben); await lkp.waitForTimeout(900);
    const lage = await lkp.evaluate(() => Math.round(document.querySelector('.schau').getBoundingClientRect().top));
    ok(`home ${w}x${h}: gallery not pinned before it reaches the top`, Math.abs(lage - 200) <= 6, `top ${lage}`);
  }
  await lkx.close();

  // ---------- 3. reduced motion + no JS ----------
  const rm = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p2 = await rm.newPage();
  await p2.goto(B + '/', { waitUntil: 'networkidle' }); await p2.waitForTimeout(500);
  ok('reduced motion: no pinned hero, no smooth scroll', await p2.evaluate(() => !document.querySelector('.pin-spacer > [data-lk], .pin-spacer > [data-tor]') && !document.documentElement.classList.contains('lenis')));
  ok('reduced motion: home hero fully lit, no light edge', await p2.evaluate(() => {
    const lk = document.querySelector('[data-lk]');
    return getComputedStyle(lk).getPropertyValue('--a').trim() === '100' && [...lk.querySelectorAll('[data-lk-licht]')].every((e) => getComputedStyle(e).visibility === 'hidden');
  }));
  ok('reduced motion: content visible without scrolling', await p2.evaluate(() => [...document.querySelectorAll('[data-reveal]')].every((e) => getComputedStyle(e).opacity === '1')));
  await rm.close();
  const nj = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const p3 = await nj.newPage();
  await p3.goto(B + '/martin-edition/', { waitUntil: 'load' });
  ok('no JS: reveal content visible', await p3.locator('.tafeln .ed-karte').first().isVisible());
  ok('no JS: headline readable', await p3.locator('h1').first().isVisible());
  await p3.goto(B + '/', { waitUntil: 'load' });
  ok('no JS: home hero photo lit and headline visible', await p3.evaluate(() => getComputedStyle(document.querySelector('[data-lk]')).getPropertyValue('--a').trim() === '100') && await p3.locator('h1').first().isVisible());
  await nj.close();

  // ---------- 4. opening status at fixed times ----------
  const clock = async (iso) => {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'America/New_York' });
    const pg = await c.newPage();
    await pg.clock.install({ time: new Date(iso) });
    await pg.goto(B + '/standorte/', { waitUntil: 'load' });
    await pg.waitForFunction(() => window.__mmBereit === true);
    const out = await pg.evaluate(() => Object.fromEntries(['weyarn', 'schongau', 'oy-mittelberg'].map((s) => [s, document.querySelector(`.ort [data-status="${s}"] [data-status-text]`).textContent])));
    await c.close();
    return out;
  };
  let s = await clock('2026-11-16T09:30:00+01:00'); // Monday in November
  ok('status Mon 16 Nov 09:30 Berlin (visitor in New York): Weyarn/Oy closed, Schongau open', /^Geschlossen/.test(s.weyarn) && /^Geschlossen/.test(s['oy-mittelberg']) && s.schongau === 'Geöffnet bis 12:00', JSON.stringify(s));
  s = await clock('2026-11-18T12:30:00+01:00'); // Wednesday lunch
  ok('status Wed 12:30: lunch break, reopens 13:00', Object.values(s).every((v) => v === 'Geschlossen · ab 13:00'), JSON.stringify(s));
  s = await clock('2026-11-18T17:30:00+01:00'); // Wed 17:30 winter: Oy closes 17:00
  ok('status Wed 17:30 winter: Oy closed (17:00), Weyarn + Schongau open till 18:00', s.weyarn === 'Geöffnet bis 18:00' && s.schongau === 'Geöffnet bis 18:00' && /^Geschlossen/.test(s['oy-mittelberg']), JSON.stringify(s));
  s = await clock('2026-07-11T12:45:00+02:00'); // Saturday in July
  ok('status Sat 12:45 summer: Schongau closed (12:30), others open till 13:00', /^Geschlossen/.test(s.schongau) && s.weyarn === 'Geöffnet bis 13:00' && s['oy-mittelberg'] === 'Geöffnet bis 13:00', JSON.stringify(s));
  s = await clock('2026-12-07T10:00:00+01:00'); // Monday in December: all closed
  ok('status Mon in December: all three closed, next opening Tuesday', Object.values(s).every((v) => /^Geschlossen · ab morgen/.test(v)), JSON.stringify(s));

  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });

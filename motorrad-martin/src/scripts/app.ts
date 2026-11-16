/**
 * Globales Verhalten: Einblendungen, Kopfzeile, Dialoge, Typenschild-Satz und
 * Live-Status. Alles ist Progressive Enhancement – ohne JavaScript bleibt jede
 * Seite vollständig les- und bedienbar.
 *
 * Gescrollt wird nativ: Der Browser scrollt auf dem Compositor, unabhängig vom
 * Hauptprozess. Kein Skript hängt sich in jeden Scroll-Frame, das hält es flüssig.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initFit } from './fit';
import { initStatus } from './status';

gsap.registerPlugin(ScrollTrigger);
// Ein- und ausfahrende Adressleiste auf dem Handy löst keine Neuberechnung (und damit keinen Sprung) aus
ScrollTrigger.config({ ignoreMobileResize: true });

const ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fein = matchMedia('(hover: hover) and (pointer: fine)').matches;
const html = document.documentElement;

/* ---- Einblendungen ---- */
function initReveal() {
  const ziele = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal], .fit'));
  if (ruhig || !('IntersectionObserver' in window)) {
    ziele.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (eintraege) => {
      for (const e of eintraege) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -7% 0px', threshold: 0.08 },
  );
  ziele.forEach((el) => io.observe(el));
}

/* ---- Kopfzeile: Ton folgt dem Abschnitt darunter, blendet beim Runterscrollen aus ----
   Kein Ausmessen pro Frame: Ein IntersectionObserver meldet, welche Abschnitte gerade
   unter der Mittellinie der Kopfzeile liegen; der Scroll-Handler liest nur scrollY. */
function initKopfzeile() {
  const kopf = document.querySelector<HTMLElement>('[data-kopfzeile]');
  if (!kopf) return;
  const WAEHLER = 'main [data-theme="dark"], main [data-kopf], footer[data-theme="dark"]';
  const grund = document.body.dataset.theme === 'dark' ? 'dunkel' : 'hell';
  const darunter = new Set<HTMLElement>();

  const bestimme = () => {
    let ton = grund;
    // der im DOM späteste Treffer gewinnt (innerster bzw. weiter unten liegender Abschnitt)
    const liste = Array.from(darunter).sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    for (const el of liste) ton = el.dataset.kopf ?? (el.dataset.theme === 'dark' ? 'dunkel' : 'hell');
    if (kopf.dataset.ton !== ton) kopf.dataset.ton = ton;
  };

  let io: IntersectionObserver | null = null;
  const beobachte = () => {
    io?.disconnect();
    darunter.clear();
    const mitte = Math.round(kopf.offsetHeight / 2);
    io = new IntersectionObserver(
      (eintraege) => {
        for (const e of eintraege) {
          if (e.isIntersecting) darunter.add(e.target as HTMLElement);
          else darunter.delete(e.target as HTMLElement);
        }
        bestimme();
      },
      { rootMargin: `-${mitte}px 0px -${Math.max(0, window.innerHeight - mitte - 1)}px 0px` },
    );
    document.querySelectorAll<HTMLElement>(WAEHLER).forEach((el) => io!.observe(el));
  };
  beobachte();
  // Abschnitte, die ihren Ton beim Scrollen selbst umstellen (data-kopf), sofort übernehmen
  new MutationObserver(bestimme).observe(document.querySelector('main') ?? document.body, { subtree: true, attributes: true, attributeFilter: ['data-kopf'] });

  let letzte = window.scrollY;
  let wartet = false;
  const lauf = () => {
    wartet = false;
    const y = window.scrollY;
    const fest = y > 12;
    if (kopf.classList.contains('ist-fest') !== fest) kopf.classList.toggle('ist-fest', fest);
    const runter = y > letzte + 4;
    const hoch = y < letzte - 4;
    if (y < 200 || hoch) kopf.classList.remove('ist-weg');
    else if (runter && !kopf.contains(document.activeElement)) kopf.classList.add('ist-weg');
    if (runter || hoch) letzte = y;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (wartet) return;
      wartet = true;
      requestAnimationFrame(lauf);
    },
    { passive: true },
  );
  let warte = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(warte);
    warte = window.setTimeout(beobachte, 200);
  });
  kopf.addEventListener('focusin', () => kopf.classList.remove('ist-weg'));
  lauf();
}

/* ---- Dialoge (Menü, Hauswahl) ---- */
function initDialoge() {
  const oeffne = (d: HTMLDialogElement, ausloeser?: HTMLElement) => {
    if (d.open) return;
    d.showModal();
    html.classList.add('dialog-offen');
    ausloeser?.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => d.classList.add('ist-offen'));
  };
  const schliesse = (d: HTMLDialogElement) => {
    if (!d.open) return;
    d.classList.remove('ist-offen');
    const fertig = () => {
      d.close();
      d.removeEventListener('transitionend', ende);
    };
    const ende = (e: TransitionEvent) => e.target === d && fertig();
    if (ruhig) fertig();
    else {
      d.addEventListener('transitionend', ende);
      window.setTimeout(() => d.open && fertig(), 700);
    }
  };

  document.querySelectorAll<HTMLDialogElement>('dialog[data-dialog]').forEach((d) => {
    d.addEventListener('close', () => {
      d.classList.remove('ist-offen');
      if (!document.querySelector('dialog[open]')) {
        html.classList.remove('dialog-offen');
      }
      document.querySelectorAll(`[aria-controls="${d.id}"]`).forEach((b) => b.setAttribute('aria-expanded', 'false'));
    });
    d.addEventListener('cancel', (e) => {
      e.preventDefault();
      schliesse(d);
    });
    // Klick auf den Hintergrund schließt
    d.addEventListener('click', (e) => {
      if (e.target === d) schliesse(d);
    });
    // Navigation aus dem Dialog heraus: sofort schließen
    d.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((a) =>
      a.addEventListener('click', () => {
        if (a.getAttribute('href')?.startsWith('#') || a.pathname === location.pathname) schliesse(d);
      }),
    );
  });

  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const auf = t.closest<HTMLElement>('[data-dialog-oeffnen], [data-hauswahl-oeffnen]');
    if (auf) {
      const id = auf.dataset.dialogOeffnen || 'hauswahl';
      const d = document.getElementById(id) as HTMLDialogElement | null;
      if (d) {
        e.preventDefault();
        // ein offener Dialog weicht dem neuen
        document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach((o) => o !== d && o.close());
        oeffne(d, auf);
      }
      return;
    }
    const zu = t.closest<HTMLElement>('[data-dialog-schliessen]');
    if (zu) {
      const d = zu.closest('dialog');
      if (d) schliesse(d);
    }
  });
}

/* ---- Parallaxe für ausgewählte Bilder ---- */
function initParallaxe() {
  if (ruhig) return;
  document.querySelectorAll<HTMLElement>('[data-parallaxe]').forEach((el) => {
    const staerke = Number(el.dataset.parallaxe) || 8;
    const ziel = el.querySelector('img') ?? el;
    gsap.fromTo(
      ziel,
      { yPercent: -staerke, scale: 1 + staerke / 50 },
      { yPercent: staerke, scale: 1 + staerke / 50, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  });
}

/* ---- Horizontale Galerie: am Desktop an den Scroll gekoppelt, mobil natives Wischen ---- */
function initHorizontal() {
  document.querySelectorAll<HTMLElement>('[data-horizontal]').forEach((buehne) => {
    const band = buehne.querySelector<HTMLElement>('[data-band]');
    const balken = buehne.querySelector<HTMLElement>('[data-fortschritt]');
    if (!band) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      buehne.classList.add('ist-gekoppelt');
      const weg = () => Math.max(0, band.scrollWidth - buehne.clientWidth);
      const tween = gsap.to(band, {
        x: () => -weg(),
        ease: 'none',
        scrollTrigger: {
          trigger: buehne,
          start: 'top top',
          // Die Galerie läuft schneller als gescrollt wird: weniger Weg bis zum nächsten Abschnitt
          end: () => `+=${weg() * 0.45}`,
          pin: true,
          scrub: 0.3,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (s) => balken && (balken.style.transform = `scaleX(${s.progress})`),
        },
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        gsap.set(band, { clearProps: 'transform' });
        buehne.classList.remove('ist-gekoppelt');
      };
    });
    // Fortschritt beim nativen Wischen
    band.addEventListener(
      'scroll',
      () => {
        if (!balken || buehne.classList.contains('ist-gekoppelt')) return;
        const max = band.scrollWidth - band.clientWidth;
        balken.style.transform = `scaleX(${max > 0 ? band.scrollLeft / max : 0})`;
      },
      { passive: true },
    );
  });
}

/* ---- Register: Bild folgt dem Zeiger ---- */
function initRegister() {
  if (!fein) return;
  document.querySelectorAll<HTMLElement>('[data-register]').forEach((reg) => {
    const vorschau = reg.querySelector<HTMLElement>('[data-vorschau]');
    if (!vorschau) return;
    const bilder = Array.from(vorschau.querySelectorAll<HTMLElement>('[data-vorschau-bild]'));
    const x = gsap.quickTo(vorschau, 'x', { duration: 0.55, ease: 'power3' });
    const y = gsap.quickTo(vorschau, 'y', { duration: 0.55, ease: 'power3' });
    let aktiv: string | null = null;

    const zeige = (id: string | null) => {
      if (id === aktiv) return;
      aktiv = id;
      vorschau.classList.toggle('ist-sichtbar', !!id);
      bilder.forEach((b) => b.classList.toggle('ist-aktiv', b.dataset.vorschauBild === id));
    };
    reg.addEventListener('pointermove', (e) => {
      const r = reg.getBoundingClientRect();
      x(e.clientX - r.left);
      y(e.clientY - r.top);
      const zeile = (e.target as HTMLElement).closest<HTMLElement>('[data-zeile]');
      zeige(zeile && !zeile.hidden ? zeile.dataset.zeile! : null);
    });
    reg.addEventListener('pointerleave', () => zeige(null));
  });
}

/* ---- Filter (z. B. Baureihen der Edition) ---- */
function initFilter() {
  document.querySelectorAll<HTMLElement>('[data-filter]').forEach((leiste) => {
    const name = leiste.dataset.filter!;
    const knoepfe = Array.from(leiste.querySelectorAll<HTMLButtonElement>('[data-wert]'));
    const ziele = Array.from(document.querySelectorAll<HTMLElement>(`[data-${name}]`)).filter((el) => !leiste.contains(el));
    const zaehler = document.querySelector<HTMLElement>(`[data-filter-zahl="${name}"]`);
    const setze = (wert: string) => {
      const anwenden = () => {
        let n = 0;
        ziele.forEach((el) => {
          const passt = wert === 'alle' || el.dataset[name] === wert;
          el.hidden = !passt;
          if (passt && el.matches('li[data-karte]')) n++;
        });
        knoepfe.forEach((k) => k.setAttribute('aria-pressed', String(k.dataset.wert === wert)));
        if (zaehler) zaehler.textContent = String(n).padStart(2, '0');
        ScrollTrigger.refresh();
      };
      const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
      if (doc.startViewTransition && !ruhig) doc.startViewTransition(anwenden);
      else anwenden();
    };
    knoepfe.forEach((k) => k.addEventListener('click', () => setze(k.dataset.wert!)));
  });
}

/* ---- Ansicht umschalten (Register / Tafeln) ---- */
function initAnsicht() {
  document.querySelectorAll<HTMLElement>('[data-ansicht-wahl]').forEach((wahl) => {
    const ziel = document.querySelector<HTMLElement>(wahl.dataset.ansichtWahl!);
    if (!ziel) return;
    const knoepfe = Array.from(wahl.querySelectorAll<HTMLButtonElement>('[data-ansicht]'));
    const setze = (a: string, merken = true) => {
      ziel.dataset.ansicht = a;
      knoepfe.forEach((k) => k.setAttribute('aria-pressed', String(k.dataset.ansicht === a)));
      if (merken) {
        try {
          sessionStorage.setItem('mm:ansicht', a);
        } catch {
          /* egal */
        }
      }
      ScrollTrigger.refresh();
    };
    knoepfe.forEach((k) => k.addEventListener('click', () => setze(k.dataset.ansicht!)));
    try {
      const g = sessionStorage.getItem('mm:ansicht');
      if (g && fein) setze(g, false);
    } catch {
      /* egal */
    }
  });
}

/* ---- Externe Einbettungen erst nach Klick laden (kein Fremdinhalt ohne Zustimmung) ---- */
function initEinbettung() {
  document.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-einbetten]');
    if (!b) return;
    const box = b.closest<HTMLElement>('[data-einbettung]');
    if (!box) return;
    const f = document.createElement('iframe');
    f.src = box.dataset.einbettung!;
    f.title = box.dataset.titel || 'Eingebetteter Inhalt';
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    box.replaceChildren(f);
    box.classList.add('ist-geladen');
    ScrollTrigger.refresh();
  });
}

/* ---- Start ---- */
initKopfzeile();
initDialoge();
initStatus();
initFilter();
initAnsicht();
initEinbettung();
initFit().then(() => {
  initReveal();
  initParallaxe();
  initHorizontal();
  initRegister();
  (window as unknown as { __mmBereit?: boolean }).__mmBereit = true;
  document.dispatchEvent(new CustomEvent('mm:bereit'));
  // Bilder und Schriften können die Seitenhöhe verändern
  window.addEventListener('load', () => ScrollTrigger.refresh());
});

export { gsap, ScrollTrigger };

/**
 * Typenschild-Satz.
 * Setzt jede Zeile einer .fit-Schlagzeile exakt auf Spaltenbreite. Zuerst wird eine
 * gemeinsame Schriftgröße gesucht, bei der alle Zeilen allein über die Breitenachse
 * der Schrift (62–125 %) bündig werden; nur wenn die Zeilenlängen dafür zu weit
 * auseinanderliegen, bekommt eine Zeile zusätzlich eine eigene Größe.
 */
const MIN = 62;
const MAX = 125;
const BASIS = 100; // px, Messgröße

function messe(el: HTMLElement, wdth: number): number {
  el.style.fontStretch = `${wdth}%`;
  return el.getBoundingClientRect().width;
}

function fitSatz(satz: HTMLElement, breite: number) {
  const zeilen = Array.from(satz.querySelectorAll<HTMLElement>('.fit__line'));
  if (!zeilen.length || breite <= 0) return;

  satz.style.fontSize = `${BASIS}px`;
  zeilen.forEach((z) => (z.style.fontSize = ''));
  const m = zeilen.map((z) => ({ z, schmal: messe(z, MIN), breit: messe(z, MAX) }));

  // Größenbereich, in dem jede Zeile allein über die Breitenachse bündig wird.
  // Passen nicht alle zusammen, scheidet die jeweils kürzeste Zeile aus und wird
  // später eigens vergrößert (z. B. ein einzelnes „KEIN“ über zwei langen Zeilen).
  let gruppe = [...m];
  let unten = 0;
  let oben = 0;
  for (;;) {
    unten = Math.max(...gruppe.map((x) => (BASIS * breite) / x.breit));
    oben = Math.min(...gruppe.map((x) => (BASIS * breite) / x.schmal));
    if (unten <= oben || gruppe.length === 1) break;
    const kurz = gruppe.reduce((a, b) => (a.breit < b.breit ? a : b));
    gruppe = gruppe.filter((x) => x !== kurz);
  }
  const groesse = Math.min(oben, unten * 1.06);
  const ziel = (breite * BASIS) / groesse; // Zielbreite bei Messgröße

  for (const { z, schmal, breit } of m) {
    if (breit <= ziel) {
      z.style.fontStretch = `${MAX}%`;
      z.style.fontSize = `${(ziel / breit - 0.0005).toFixed(4)}em`;
      continue;
    }
    if (schmal >= ziel) {
      z.style.fontStretch = `${MIN}%`;
      z.style.fontSize = `${(ziel / schmal - 0.0005).toFixed(4)}em`;
      continue;
    }
    let lo = MIN;
    let hi = MAX;
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      if (messe(z, mid) > ziel) hi = mid;
      else lo = mid;
    }
    z.style.fontStretch = `${lo.toFixed(2)}%`;
  }
  satz.style.fontSize = `${groesse.toFixed(2)}px`;

  // Feinabgleich bei Endgröße: Schriftweiten skalieren nicht in jedem Browser exakt
  // linear mit der Größe – jede Zeile wird deshalb noch einmal real gemessen.
  for (let lauf = 0; lauf < 2; lauf++) {
    for (const { z } of m) {
      const ist = z.getBoundingClientRect().width;
      if (!ist || Math.abs(ist - breite) < 0.4) continue;
      const em = parseFloat(z.style.fontSize) || 1;
      z.style.fontSize = `${((em * (breite - 0.2)) / ist).toFixed(4)}em`;
    }
  }
}

function fit(el: HTMLElement) {
  const breite = el.clientWidth;
  if (!breite) return;
  // ab hier gelten die Zeilen als gesetzt: kein Umbruch, Breite nach Inhalt
  el.dataset.fit = 'done';
  el.querySelectorAll<HTMLElement>('.fit__satz').forEach((satz) => {
    if (getComputedStyle(satz).display === 'none') return;
    fitSatz(satz, breite);
  });
}

export function initFit() {
  const alle = Array.from(document.querySelectorAll<HTMLElement>('[data-fit]'));
  if (!alle.length) return Promise.resolve();
  const lauf = () => alle.forEach(fit);
  const bereit: Promise<unknown> = document.fonts?.ready ?? Promise.resolve();
  return bereit.then(() => {
    lauf();
    let w = window.innerWidth;
    let t = 0;
    window.addEventListener('resize', () => {
      if (window.innerWidth === w) return;
      w = window.innerWidth;
      cancelAnimationFrame(t);
      t = requestAnimationFrame(lauf);
    });
  });
}

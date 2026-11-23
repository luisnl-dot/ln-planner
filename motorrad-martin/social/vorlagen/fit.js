/* Typenschild-Satz für die Vorlagen (wie src/scripts/fit.ts der Website):
   Alle Zeilen eines .fit-Blocks bekommen eine gemeinsame Größe und werden über die
   Breitenachse der Archivo (62–125 %) exakt auf die Blockbreite gesetzt. Passen die
   Längen nicht zusammen, bekommt die kürzeste Zeile eine eigene Größe. */
(function () {
  const MIN = 62;
  const MAX = 125;
  const BASIS = 100;
  const messe = (z, w) => {
    z.style.fontStretch = w + '%';
    return z.getBoundingClientRect().width;
  };
  function satz(el) {
    const breite = el.clientWidth;
    const zeilen = Array.from(el.querySelectorAll('.z'));
    if (!zeilen.length || !breite) return;
    el.style.fontSize = BASIS + 'px';
    zeilen.forEach((z) => (z.style.fontSize = ''));
    const maxW = Number(el.dataset.max || MAX);
    const minW = Number(el.dataset.min || MIN);
    const m = zeilen.map((z) => ({ z, schmal: messe(z, minW), breit: messe(z, maxW) }));
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
    const ziel = (breite * BASIS) / groesse;
    for (const { z, schmal, breit } of m) {
      if (breit <= ziel) {
        z.style.fontStretch = maxW + '%';
        z.style.fontSize = (ziel / breit).toFixed(4) + 'em';
        continue;
      }
      if (schmal >= ziel) {
        z.style.fontStretch = minW + '%';
        z.style.fontSize = (ziel / schmal).toFixed(4) + 'em';
        continue;
      }
      let lo = minW;
      let hi = maxW;
      for (let i = 0; i < 14; i++) {
        const mid = (lo + hi) / 2;
        if (messe(z, mid) > ziel) hi = mid;
        else lo = mid;
      }
      z.style.fontStretch = lo.toFixed(2) + '%';
    }
    el.style.fontSize = groesse.toFixed(2) + 'px';
    for (let lauf = 0; lauf < 3; lauf++) {
      for (const { z } of m) {
        const ist = z.getBoundingClientRect().width;
        if (!ist || Math.abs(ist - breite) < 0.5) continue;
        const em = parseFloat(z.style.fontSize) || 1;
        z.style.fontSize = ((em * (breite - 0.5)) / ist).toFixed(4) + 'em';
      }
    }
  }
  window.setzeAlles = () => document.querySelectorAll('.fit').forEach(satz);
  window.bereit = document.fonts.ready.then(() => {
    window.setzeAlles();
    // Bilder fertig laden lassen
    return Promise.all(Array.from(document.images).map((i) => (i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = r)))));
  });
})();

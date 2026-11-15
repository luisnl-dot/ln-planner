/**
 * Miet-Preisrechner. Rechnet ausschließlich mit den veröffentlichten Tarifen
 * (Tagespreis inkl. 300 km, 3-Tages- und Wochenpauschale, Probefahrtenpauschale,
 * Zubehör, Reinigung) und kennzeichnet das Ergebnis als unverbindlich.
 */
interface Regeln {
  freiKmTag: number;
  mehrKm: number;
  reinigung: number;
  kaution: number;
  koffer: { tag: number; min: number };
  navi: { tag: number; fest: number; festAb: number };
  dreiTage: { zahlen: number; freiKm: number };
  woche: { zahlen: number; freiKm: number };
  halbtag: number;
  zweiStunden: number;
}

const eur = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }) + ' €';

document.querySelectorAll<HTMLElement>('[data-rechner]').forEach((box) => {
  const r: Regeln = JSON.parse(box.dataset.regeln!);
  const modell = box.querySelector<HTMLSelectElement>('[data-r-modell]')!;
  const koffer = box.querySelector<HTMLInputElement>('[data-r-koffer]')!;
  const navi = box.querySelector<HTMLInputElement>('[data-r-navi]')!;
  const km = box.querySelector<HTMLInputElement>('[data-r-km]')!;
  const summe = box.querySelector<HTMLElement>('[data-r-summe]')!;
  const titel = box.querySelector<HTMLElement>('[data-r-titel]')!;
  const posten = box.querySelector<HTMLElement>('[data-r-posten]')!;
  const fuss = box.querySelector<HTMLElement>('[data-r-fuss]')!;
  const dauerHinweis = box.querySelector<HTMLElement>('[data-r-dauerhinweis]')!;
  const anfrage = box.querySelector<HTMLAnchorElement>('[data-r-anfrage]')!;

  const rechne = () => {
    const o = modell.selectedOptions[0];
    const tag = Number(o.dataset.tag);
    const dauer = box.querySelector<HTMLInputElement>('input[name="dauer"]:checked')!.value;
    const zeilen: [string, string][] = [];
    let miete = 0;
    let tage = 1;
    let frei = r.freiKmTag;
    let text = '';
    let hinweis = '';
    let kmPreis: number | null = r.mehrKm;

    if (dauer === '2h') {
      miete = tag * r.zweiStunden;
      text = '2 Stunden';
      zeilen.push(['Probefahrtenpauschale · 30 % vom Tagespreis', eur(miete)]);
      hinweis = 'Montag bis Freitag.';
      frei = 0;
      kmPreis = null;
    } else if (dauer === 'halb') {
      miete = tag * r.halbtag;
      text = 'Halber Tag';
      zeilen.push(['Probefahrtenpauschale · halber Tagespreis', eur(miete)]);
      hinweis = 'Montag bis Freitag, 9.00 – 13.00 oder 13.00 – 17.00 Uhr.';
      frei = 0;
      kmPreis = null;
    } else if (dauer === '3') {
      tage = 3;
      miete = tag * r.dreiTage.zahlen;
      frei = r.dreiTage.freiKm;
      text = '3 Tage';
      zeilen.push([`3-Tages-Pauschale · ${r.dreiTage.zahlen} × ${eur(tag)}`, eur(miete)]);
      hinweis = 'Abholung ab 13.00 Uhr, Rückgabe nach 3 Tagen bis 10.00 Uhr. Ideal fürs Wochenende.';
      kmPreis = null; // Mehrkilometer hier modellabhängig 0,55 – 0,90 €
    } else if (dauer === '7') {
      tage = 7;
      miete = tag * r.woche.zahlen;
      frei = r.woche.freiKm;
      text = '1 Woche';
      zeilen.push([`Wochenpauschale · ${r.woche.zahlen} × ${eur(tag)}`, eur(miete)]);
      hinweis = '7 Tage fahren, 5 Tage bezahlen.';
    } else {
      tage = Number(dauer);
      miete = tag * tage;
      frei = r.freiKmTag * tage;
      text = tage === 1 ? '1 Tag' : `${tage} Tage`;
      zeilen.push([`${tage} × Tagespreis ${eur(tag)}`, eur(miete)]);
      hinweis = tage === 2 ? 'Tipp: Die 3-Tages-Pauschale kostet dasselbe wie 2 Einzeltage.' : 'Anmietung an Samstag und Sonntag nur über die 3-Tages-Pauschale.';
    }

    let gesamt = miete;
    if (frei) zeilen.push(['Inklusive Kilometer', `${frei.toLocaleString('de-DE')} km`]);

    const strecke = Number(km.value);
    if (strecke > frei && frei > 0) {
      if (kmPreis !== null) {
        const mehr = (strecke - frei) * kmPreis;
        gesamt += mehr;
        zeilen.push([`Mehrkilometer · ${strecke - frei} km × ${eur(kmPreis)}`, eur(mehr)]);
      } else {
        zeilen.push([`Mehrkilometer · ${strecke - frei} km`, '0,55 – 0,90 €/km']);
      }
    }
    if (koffer.checked) {
      const k = Math.max(r.koffer.min, r.koffer.tag * tage);
      gesamt += k;
      zeilen.push(['Koffer', eur(k)]);
    }
    if (navi.checked) {
      const n = tage >= r.navi.festAb ? r.navi.fest : r.navi.tag * tage;
      gesamt += n;
      zeilen.push(['Navigationsgerät', eur(n)]);
    }
    gesamt += r.reinigung;
    zeilen.push(['Reinigungspauschale', eur(r.reinigung)]);

    summe.textContent = eur(Math.round(gesamt * 100) / 100);
    titel.textContent = `BMW ${o.value} · ${text}`;
    posten.replaceChildren(
      ...zeilen.map(([k, v]) => {
        const d = document.createElement('div');
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = k;
        dd.textContent = v;
        d.append(dt, dd);
        return d;
      }),
    );
    fuss.textContent = `Zzgl. Kaution ${eur(r.kaution)} (bar oder Kreditkarte) · Selbstbeteiligung ${eur(Number(o.dataset.sb))}${o.dataset.ab23 ? ' · ab 23 Jahren, mind. 2 Jahre Führerschein' : ''} · je nach Verfügbarkeit.`;
    dauerHinweis.textContent = hinweis;
    anfrage.onclick = () => {
      const feld = document.querySelector<HTMLInputElement>('#anfrage [name="fahrzeug"]');
      if (feld) feld.value = `BMW ${o.value} · ${text}`;
    };
  };

  box.addEventListener('input', rechne);
  box.addEventListener('change', rechne);
  rechne();
});

/**
 * Formulare: verständliche Fehlermeldungen, Vorbelegung per URL (?anliegen=…&fahrzeug=…)
 * und Versand – entweder an einen konfigurierten Endpunkt oder als vorbereitete E-Mail.
 */
const TEXT: Record<string, string> = {
  valueMissing: 'Bitte füllen Sie dieses Feld aus.',
  typeMismatch: 'Bitte geben Sie eine gültige Adresse ein.',
  patternMismatch: 'Bitte prüfen Sie das Format.',
};
const BESCHRIFTUNG: Record<string, string> = {
  anliegen: 'Anliegen',
  haus: 'Haus',
  name: 'Name',
  vorname: 'Vorname',
  nachname: 'Nachname',
  email: 'E-Mail',
  telefon: 'Telefon',
  fahrzeug: 'Fahrzeug / Modell',
  termin: 'Wunschtermin',
  nachricht: 'Nachricht',
};

type Feld = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function pruefe(feld: Feld): boolean {
  const huelle = feld.closest('.feld, .haken, fieldset');
  huelle?.querySelector('.feld__fehler')?.remove();
  if (feld.checkValidity()) {
    feld.removeAttribute('aria-invalid');
    feld.removeAttribute('aria-describedby');
    return true;
  }
  const v = feld.validity;
  let text = TEXT.valueMissing;
  if (feld.type === 'checkbox') text = 'Bitte bestätigen Sie dieses Feld.';
  else if (v.typeMismatch) text = TEXT.typeMismatch;
  else if (v.patternMismatch) text = TEXT.patternMismatch;
  const id = `${feld.id || feld.name}-fehler`;
  const p = document.createElement('p');
  p.className = 'feld__fehler';
  p.id = id;
  p.textContent = text;
  feld.setAttribute('aria-invalid', 'true');
  feld.setAttribute('aria-describedby', id);
  huelle?.append(p);
  return false;
}

function zeilen(form: HTMLFormElement): [string, string][] {
  const aus: [string, string][] = [];
  const daten = new FormData(form);
  const gesehen = new Set<string>();
  for (const [name, wert] of daten.entries()) {
    if (name === 'einwilligung' || typeof wert !== 'string' || !wert.trim() || gesehen.has(name)) continue;
    gesehen.add(name);
    const feld = form.elements.namedItem(name);
    let text = wert.trim();
    if (feld instanceof HTMLSelectElement) text = feld.selectedOptions[0]?.textContent?.trim() || text;
    const titel = (form.querySelector<HTMLElement>(`[data-titel-fuer="${name}"]`)?.textContent || BESCHRIFTUNG[name] || form.querySelector(`label[for="${(feld as HTMLElement)?.id}"]`)?.childNodes[0]?.textContent || name).trim();
    aus.push([titel, text]);
  }
  return aus;
}

function melde(form: HTMLFormElement, text: string, art: 'ok' | 'fehler' = 'ok') {
  const m = form.querySelector<HTMLElement>('[data-meldung]');
  if (!m) return;
  m.hidden = false;
  m.dataset.art = art;
  m.textContent = text;
  m.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function init(form: HTMLFormElement) {
  // Vorbelegung aus der URL
  const q = new URLSearchParams(location.search);
  for (const [k, v] of q) {
    const feld = form.elements.namedItem(k);
    if (feld instanceof HTMLSelectElement) {
      if ([...feld.options].some((o) => o.value === v)) {
        feld.value = v;
        feld.dataset.gesetzt = '1';
      }
    } else if (feld instanceof HTMLInputElement && feld.type !== 'checkbox' && feld.type !== 'file' && !feld.value) {
      feld.value = v.slice(0, 200);
    }
  }

  // Fehler verschwinden schon beim Korrigieren – nicht erst beim Verlassen des Feldes.
  // Sonst verschiebt sich das Layout genau in dem Moment, in dem auf „Senden“ geklickt wird,
  // und der Klick geht ins Leere.
  const nachpruefen = (e: Event) => {
    const f = e.target as Feld;
    if (f.matches?.('input, select, textarea') && f.hasAttribute('aria-invalid')) pruefe(f);
  };
  form.addEventListener('input', nachpruefen);
  form.addEventListener('change', nachpruefen);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const felder = Array.from(form.querySelectorAll<Feld>('input, select, textarea')).filter((f) => f.willValidate);
    const fehler = felder.filter((f) => !pruefe(f));
    if (fehler.length) {
      fehler[0].focus();
      return;
    }

    const haus = form.querySelector<HTMLSelectElement>('[name="haus"]')?.selectedOptions[0];
    const anliegen = form.querySelector<HTMLSelectElement>('[name="anliegen"]')?.selectedOptions[0]?.textContent?.trim() || form.dataset.betreff || 'Anfrage';
    const name = [(form.elements.namedItem('vorname') as HTMLInputElement)?.value, (form.elements.namedItem('nachname') as HTMLInputElement)?.value, (form.elements.namedItem('name') as HTMLInputElement)?.value].filter(Boolean).join(' ');
    const betreff = `${anliegen} – ${name}`.trim();
    const liste = zeilen(form);
    const dateien = Array.from(form.querySelectorAll<HTMLInputElement>('input[type="file"]')).flatMap((i) => Array.from(i.files ?? []));

    const endpunkt = form.dataset.endpunkt;
    if (endpunkt) {
      const knopf = form.querySelector<HTMLButtonElement>('[type="submit"]');
      knopf?.setAttribute('disabled', '');
      try {
        const daten = new FormData(form);
        daten.set('betreff', betreff);
        const r = await fetch(endpunkt, { method: 'POST', body: daten, headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error(String(r.status));
        form.reset();
        melde(form, 'Vielen Dank – Ihre Anfrage ist bei uns eingegangen. Wir melden uns schnellstmöglich.');
      } catch {
        melde(form, 'Das hat leider nicht geklappt. Bitte versuchen Sie es erneut oder rufen Sie uns an.', 'fehler');
      } finally {
        knopf?.removeAttribute('disabled');
      }
      return;
    }

    // Ohne Endpunkt: vorbereitete E-Mail an das gewählte Haus
    const an = haus?.dataset.email || form.dataset.email || '';
    if (!an) {
      melde(form, 'Bitte wählen Sie ein Haus aus.', 'fehler');
      return;
    }
    const text = [
      'Guten Tag,',
      '',
      ...liste.map(([k, v]) => (v.includes('\n') || v.length > 70 ? `${k}:\n${v}\n` : `${k}: ${v}`)),
      ...(dateien.length ? ['', `Fotos im Anhang (bitte anhängen): ${dateien.map((d) => d.name).join(', ')}`] : []),
      '',
      'Gesendet über motorrad-martin.de',
    ].join('\n');
    // über einen Link auslösen – so bleibt die Seite in jedem Browser stehen
    const link = document.createElement('a');
    link.href = `mailto:${an}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(text)}`;
    link.dataset.vorbereitet = '';
    link.hidden = true;
    form.append(link);
    link.click();
    link.remove();
    melde(
      form,
      dateien.length
        ? `Ihr E-Mail-Programm öffnet sich mit der vorbereiteten Anfrage an ${an}. Bitte hängen Sie Ihre ${dateien.length} Foto(s) an und senden Sie die Nachricht ab.`
        : `Ihr E-Mail-Programm öffnet sich mit der vorbereiteten Anfrage an ${an}. Bitte senden Sie die Nachricht dort ab.`,
    );
  });
}

document.querySelectorAll<HTMLFormElement>('form[data-anfrage]:not([data-bereit])').forEach((f) => {
  f.dataset.bereit = '1';
  init(f);
});

import { berlin, status } from '../lib/zeiten';
import type { Zeiten } from '../data/standorte';

interface Haus {
  slug: string;
  ort: string;
  tel: string;
  telefon: string;
  zeiten: Zeiten;
}

const KEY = 'mm:haus';

export function meinHaus(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
function setzeHaus(slug: string | null) {
  try {
    if (slug) localStorage.setItem(KEY, slug);
    else localStorage.removeItem(KEY);
  } catch {
    /* privates Fenster – dann eben ohne Merken */
  }
}

export function initStatus() {
  const quelle = document.getElementById('haeuser-daten');
  if (!quelle) return;
  const haeuser: Haus[] = JSON.parse(quelle.textContent || '[]');
  const finde = (slug: string | null) => haeuser.find((h) => h.slug === slug);

  const zeichne = () => {
    const jetzt = berlin();
    const st = new Map(haeuser.map((h) => [h.slug, status(h.zeiten, jetzt)]));
    const mein = finde(meinHaus());

    document.querySelectorAll<HTMLElement>('[data-status]').forEach((el) => {
      const ziel = el.dataset.status!;
      const text = el.querySelector<HTMLElement>('[data-status-text]');
      if (!text) return;
      if (ziel === 'auto') {
        if (mein) {
          const s = st.get(mein.slug)!;
          el.dataset.offen = s.offen ? 'ja' : 'nein';
          text.textContent = `${mein.ort} · ${s.offen ? 'geöffnet ' + s.text : s.text}`;
          el.setAttribute('aria-label', `Mein Haus: ${mein.ort}. ${s.lang}. Haus wechseln`);
        } else {
          const offen = haeuser.filter((h) => st.get(h.slug)!.offen).length;
          el.dataset.offen = offen ? 'ja' : 'nein';
          // geschlossen: das Haus nennen, das als nächstes öffnet
          const bald = [...haeuser].sort((a, b) => st.get(a.slug)!.inMinuten - st.get(b.slug)!.inMinuten)[0];
          text.textContent = offen ? `${offen} von ${haeuser.length} Häusern geöffnet` : `${bald.ort} öffnet ${st.get(bald.slug)!.text.replace(/^ab /, '')}`;
          el.setAttribute('aria-label', `${text.textContent}. Haus wählen`);
        }
        return;
      }
      const h = finde(ziel);
      const s = st.get(ziel);
      if (!h || !s) return;
      el.dataset.offen = s.offen ? 'ja' : 'nein';
      const kern = s.offen ? `Geöffnet ${s.text}` : s.text === 'geschlossen' ? 'Geschlossen' : `Geschlossen · ${s.text}`;
      text.textContent = el.hasAttribute('data-mit-ort') ? `${h.ort} · ${kern}` : kern;
    });

    // Elemente, die sich nach dem gemerkten Haus richten
    document.querySelectorAll<HTMLAnchorElement>('[data-mein-tel]').forEach((a) => {
      if (mein) {
        a.href = `tel:${mein.tel}`;
        a.removeAttribute('data-hauswahl-oeffnen');
      } else {
        a.href = '#hauswahl';
        a.setAttribute('data-hauswahl-oeffnen', '');
      }
    });
    document.querySelectorAll<HTMLElement>('[data-mein-haus]').forEach((el) => {
      el.toggleAttribute('data-ist-mein', el.dataset.meinHaus === mein?.slug);
    });
    document.querySelectorAll<HTMLButtonElement>('[data-haus-merken]').forEach((b) => {
      const aktiv = b.dataset.hausMerken === mein?.slug;
      b.setAttribute('aria-pressed', String(aktiv));
      b.textContent = aktiv ? 'Mein Haus ✓' : 'Als mein Haus merken';
    });
    document.querySelectorAll<HTMLSelectElement>('select[data-haus-vorwahl]').forEach((s) => {
      if (mein && !s.dataset.gesetzt && !s.value) {
        s.value = mein.slug;
        s.dataset.gesetzt = '1';
        s.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  };

  document.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-haus-merken]');
    if (!b) return;
    const slug = b.dataset.hausMerken!;
    setzeHaus(meinHaus() === slug ? null : slug);
    zeichne();
  });

  zeichne();
  window.setInterval(zeichne, 60_000);
  document.addEventListener('visibilitychange', () => !document.hidden && zeichne());
}

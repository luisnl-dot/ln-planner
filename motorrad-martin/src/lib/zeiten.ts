import type { Fenster, Woche, Zeiten } from '../data/standorte';

export interface BerlinZeit {
  tag: number; // 0 = So
  monat: number; // 1–12
  minuten: number; // seit Mitternacht
}

const WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Berlin',
  weekday: 'short',
  month: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Aktuelle Zeit in Europe/Berlin – unabhängig von der Zeitzone des Geräts. */
export function berlin(d: Date = new Date()): BerlinZeit {
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  return {
    tag: EN.indexOf(p.weekday),
    monat: Number(p.month),
    minuten: Number(p.hour) * 60 + Number(p.minute),
  };
}

const min = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const uhr = (t: string) => `${Number(t.slice(0, 2))}:${t.slice(3, 5)}`;

/** Öffnungsfenster eines Wochentags im gegebenen Monat. */
export function fenster(z: Zeiten, tag: number, monat: number): Fenster[] {
  if (tag === 1 && z.montagZu.includes(monat)) return [];
  const woche: Woche = z.winter && z.winterMonate?.includes(monat) ? z.winter : z.regulaer;
  return woche[tag];
}

export interface Status {
  offen: boolean;
  /** z. B. „bis 18:00“ oder „ab Di 9:00“ */
  text: string;
  /** z. B. „Geöffnet bis 18:00 Uhr“ */
  lang: string;
  /** Minuten bis zur nächsten Öffnung (0, wenn geöffnet). */
  inMinuten: number;
}

export function status(z: Zeiten, jetzt: BerlinZeit = berlin()): Status {
  const heute = fenster(z, jetzt.tag, jetzt.monat);
  for (const [von, bis] of heute) {
    if (jetzt.minuten >= min(von) && jetzt.minuten < min(bis)) {
      return { offen: true, text: `bis ${uhr(bis)}`, lang: `Geöffnet bis ${uhr(bis)} Uhr`, inMinuten: 0 };
    }
  }
  const spaeter = heute.find(([von]) => min(von) > jetzt.minuten);
  if (spaeter) {
    return { offen: false, text: `ab ${uhr(spaeter[0])}`, lang: `Öffnet heute um ${uhr(spaeter[0])} Uhr`, inMinuten: min(spaeter[0]) - jetzt.minuten };
  }
  for (let i = 1; i <= 7; i++) {
    const tag = (jetzt.tag + i) % 7;
    // Monatswechsel innerhalb einer Woche wird vernachlässigt – die Regeln ändern sich nur monatsweise.
    const f = fenster(z, tag, jetzt.monat);
    if (f.length) {
      const wann = i === 1 ? 'morgen' : WT[tag];
      return {
        offen: false,
        text: `ab ${wann} ${uhr(f[0][0])}`,
        lang: `Öffnet ${i === 1 ? 'morgen' : `am ${WT[tag]}.`} um ${uhr(f[0][0])} Uhr`,
        inMinuten: i * 1440 - jetzt.minuten + min(f[0][0]),
      };
    }
  }
  return { offen: false, text: 'geschlossen', lang: 'Derzeit geschlossen', inMinuten: Infinity };
}

/** schema.org openingHoursSpecification für die reguläre Woche. */
export function schemaZeiten(z: Zeiten) {
  const namen = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return z.regulaer.flatMap((f, tag) =>
    f.map(([opens, closes]) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${namen[tag]}`,
      opens,
      closes,
    })),
  );
}

/**
 * Die drei Häuser. Alle Angaben stammen von motorrad-martin.de (Stand: November 2026).
 * Öffnungszeiten sind die einzige Quelle für Footer, Standortseiten, Live-Status und JSON-LD.
 */

export type StandortSlug = 'schongau' | 'weyarn' | 'oy-mittelberg';

/** [von, bis] im Format HH:MM. Mehrere Fenster pro Tag bilden die Mittagspause ab. */
export type Fenster = [string, string];
/** Index 0 = Sonntag … 6 = Samstag (wie Date.getDay()). */
export type Woche = [Fenster[], Fenster[], Fenster[], Fenster[], Fenster[], Fenster[], Fenster[]];

export interface Zeiten {
  regulaer: Woche;
  /** Abweichende Winterzeiten, gültig in `winterMonate` (1 = Januar). */
  winter?: Woche;
  winterMonate?: number[];
  /** Monate, in denen montags geschlossen ist. */
  montagZu: number[];
}

export interface Standort {
  slug: StandortSlug;
  name: string;
  ort: string;
  rolle: string;
  region: string;
  firma: string;
  vertretung: string;
  ustId: string;
  register: string;
  gericht: string;
  strasse: string;
  plz: string;
  telefon: string;
  tel: string;
  email: string;
  /** Ortsmitte – nur für die schematische Karte, nicht als exakte Geoposition. */
  karte: { lat: number; lng: number };
  seit: string;
  flaeche?: string;
  kurz: string;
  einzugsgebiet: string[];
  anfahrt: string;
  mobileDeId: string;
  zeiten: Zeiten;
  zeitenText: { titel?: string; zeilen: [string, string][] }[];
}

const VM: Fenster = ['08:00', '12:00'];
const NM18: Fenster = ['13:00', '18:00'];
const NM17: Fenster = ['13:00', '17:00'];
const W_VM: Fenster = ['09:00', '12:00'];

const regulaer = (samstagBis: string): Woche => [
  [],
  [VM, NM18],
  [VM, NM18],
  [VM, NM18],
  [VM, NM18],
  [VM, NM17],
  [['09:00', samstagBis]],
];

export const standorte: Standort[] = [
  {
    slug: 'weyarn',
    name: 'BMW Martin Weyarn',
    ort: 'Weyarn',
    rolle: 'Home of Martin Edition',
    region: 'Oberland',
    firma: 'Martin GmbH',
    vertretung: 'Patrick Martin',
    ustId: 'DE 246117362',
    register: 'HRB 160020',
    gericht: 'München',
    strasse: 'Am Weiglfeld 20',
    plz: '83629',
    telefon: '+49 8020 90450-0',
    tel: '+498020904500',
    email: 'info-lg@motorrad-martin.de',
    karte: { lat: 47.8586, lng: 11.7989 },
    seit: '2022',
    flaeche: 'rund 3.500 m²',
    kurz: 'Seit Anfang 2022 ist der Betrieb Lenggries nach Weyarn umgezogen. Auf rund 3.500 Quadratmetern präsentieren wir hier unser Motorradangebot – und hier, in der Manufaktur, entstehen die Motorräder der Martin Edition.',
    einzugsgebiet: ['Holzkirchen', 'Miesbach', 'Bad Tölz', 'Tegernseer Tal', 'Rosenheim', 'Münchner Süden'],
    anfahrt: 'Direkt an der A8 zwischen München und Salzburg.',
    mobileDeId: '458710',
    zeiten: {
      regulaer: regulaer('13:00'),
      // Montag im Oktober und März ist auf der bisherigen Website nicht ausgewiesen –
      // hier konservativ mit den Winter-Werktagszeiten hinterlegt (siehe README).
      winter: [[], [W_VM, NM18], [W_VM, NM18], [W_VM, NM18], [W_VM, NM18], [W_VM, NM18], [['09:00', '13:00']]],
      winterMonate: [10, 11, 12, 1, 2, 3],
      montagZu: [11, 12, 1, 2],
    },
    zeitenText: [
      {
        zeilen: [
          ['Mo – Do', '8.00 – 12.00 · 13.00 – 18.00'],
          ['Fr', '8.00 – 12.00 · 13.00 – 17.00'],
          ['Sa', '9.00 – 13.00'],
        ],
      },
      {
        titel: 'Winter · Oktober bis März',
        zeilen: [
          ['Mo', 'geschlossen (Nov – Feb)'],
          ['Di – Fr', '9.00 – 12.00 · 13.00 – 18.00'],
          ['Sa', '9.00 – 13.00'],
        ],
      },
    ],
  },
  {
    slug: 'schongau',
    name: 'BMW Martin Schongau',
    ort: 'Schongau',
    rolle: 'Stammhaus seit 1954',
    region: 'Pfaffenwinkel',
    firma: 'Erwin Martin GmbH',
    vertretung: 'Georg Martin',
    ustId: 'DE128358534',
    register: 'HRB 58652',
    gericht: 'München',
    strasse: 'Marktoberdorfer Straße 16',
    plz: '86956',
    telefon: '+49 8861 9300-0',
    tel: '+49886193000',
    email: 'info-sog@motorrad-martin.de',
    karte: { lat: 47.8122, lng: 10.8964 },
    seit: '1954',
    kurz: 'In Schongau steht der Ursprung des Hauses Martin. Erwin Martin gründete den Betrieb am 1. April 1954, seit 1967 sind wir BMW Vertragspartner, seit 1969 auch für Motorräder.',
    einzugsgebiet: ['Landsberg', 'Weilheim', 'Murnau', 'Peiting', 'Kaufbeuren'],
    anfahrt: 'Im Pfaffenwinkel, verkehrsgünstig zwischen westlichem Oberbayern und Ostallgäu.',
    mobileDeId: '496822',
    zeiten: {
      regulaer: regulaer('12:30'),
      montagZu: [12, 1],
    },
    zeitenText: [
      {
        zeilen: [
          ['Mo – Do', '8.00 – 12.00 · 13.00 – 18.00'],
          ['Fr', '8.00 – 12.00 · 13.00 – 17.00'],
          ['Sa', '9.00 – 12.30'],
        ],
      },
      { titel: 'Winter', zeilen: [['Mo', 'geschlossen (Dez – Jan)']] },
    ],
  },
  {
    slug: 'oy-mittelberg',
    name: 'BMW Martin Oy-Mittelberg',
    ort: 'Oy-Mittelberg',
    rolle: 'Das Haus im Allgäu',
    region: 'Allgäu',
    firma: 'Motorrad Martin GmbH',
    vertretung: 'Sebastian Martin',
    ustId: 'DE321594582',
    register: 'HRB 14562',
    gericht: 'Kempten (Allgäu)',
    strasse: 'Gewerbepark 2',
    plz: '87466',
    telefon: '+49 8366 98488-0',
    tel: '+498366984880',
    email: 'info-oy@motorrad-martin.de',
    karte: { lat: 47.6386, lng: 10.4403 },
    seit: '1998',
    flaeche: '1.000 m²',
    kurz: 'Zum 1. Januar 1998 wurde hier der erste Filialbetrieb für Motorräder im Allgäu eröffnet. Seit dem Saisonstart im März 2018 sind wir im neuen Gebäude zu Hause: 1.000 Quadratmeter rund ums Motorrad.',
    einzugsgebiet: ['Kempten', 'Sonthofen', 'Immenstadt', 'Füssen', 'Nesselwang', 'Marktoberdorf'],
    anfahrt: 'Zwischen Oberallgäu, Tannheimer Tal und den Pässen des Allgäuer Alpenrands.',
    mobileDeId: '22089427',
    zeiten: {
      regulaer: regulaer('13:00'),
      winter: [[], [W_VM, NM18], [W_VM, NM18], [W_VM, NM17], [W_VM, NM18], [W_VM, NM17], [['09:00', '13:00']]],
      winterMonate: [10, 11, 12, 1, 2, 3],
      montagZu: [11, 12, 1, 2],
    },
    zeitenText: [
      {
        zeilen: [
          ['Mo – Do', '8.00 – 12.00 · 13.00 – 18.00'],
          ['Fr', '8.00 – 12.00 · 13.00 – 17.00'],
          ['Sa', '9.00 – 13.00'],
        ],
      },
      {
        titel: 'Winter · Oktober bis März',
        zeilen: [
          ['Mo', 'geschlossen (Nov – Feb)'],
          ['Di + Do', '9.00 – 12.00 · 13.00 – 18.00'],
          ['Mi + Fr', '9.00 – 12.00 · 13.00 – 17.00'],
          ['Sa', '9.00 – 13.00'],
        ],
      },
    ],
  },
];

export const standort = (slug: string) => standorte.find((s) => s.slug === slug)!;

export const routeUrl = (s: Standort) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${s.name}, ${s.strasse}, ${s.plz} ${s.ort}`)}`;

export const mobileDeUrl = (s: Standort) =>
  `https://home.mobile.de/home/index.html?partnerHead=false&customerId=${s.mobileDeId}`;

/** Kompakte Form für das Client-Skript (Live-Status). */
export const statusDaten = standorte.map((s) => ({
  slug: s.slug,
  ort: s.ort,
  tel: s.tel,
  telefon: s.telefon,
  zeiten: s.zeiten,
}));

export const social = {
  instagram: 'https://www.instagram.com/motorrad_martin/',
  facebook: 'https://www.facebook.com/people/BMW-Martin/100063664479197/',
};

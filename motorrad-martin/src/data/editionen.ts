/**
 * Martin Edition – die aktuelle Kollektion.
 * Namen, Basisfahrzeuge und Komponenten stammen aus der Kollektion und den Berichten
 * auf motorrad-martin.de. Die Katalognummer ist die Position in dieser Übersicht,
 * keine Fahrgestell- oder Seriennummer.
 */

export type Familie = 'GS Adventure' | 'GS' | 'R 12 G/S' | 'R 12 nineT' | 'R nineT' | 'R 18' | 'Sport';

export interface Edition {
  slug: string;
  basis: string;
  name: string;
  familie: Familie;
  /** Signaturfarbe der Edition – färbt Akzente auf ihrer Seite. */
  akzent: string;
  /** Anzahl vorhandener Bilder (1 oder 2). */
  bilder: 1 | 2;
  /** Dokumentierte Komponenten. */
  teile: string[];
  /** Kurzer Charakter-Satz für Listen. */
  zeile: string;
  /** Längerer Text, sofern auf motorrad-martin.de veröffentlicht. */
  text?: string[];
  /** Zugehöriger Journal-Beitrag. */
  journal?: string;
  /** Position des Bildausschnitts für Querformate. */
  fokus?: string;
}

export const familien: Familie[] = ['GS Adventure', 'GS', 'R 12 G/S', 'R 12 nineT', 'R nineT', 'R 18', 'Sport'];

const roh: Edition[] = [
  {
    slug: 'r-1300-gs-adventure-rallye-dakar',
    basis: 'R 1300 GS Adventure',
    name: 'Rallye Dakar',
    familie: 'GS Adventure',
    akzent: '#E2392B',
    bilder: 2,
    zeile: 'Wüsten-Legende, neu aufgelegt.',
    teile: [
      'Rallye-Dakar-Sonderlackierung in Rot/Weiß',
      'Gelbe Startnummer 20 an der Frontmaske',
      'SC-Project Rally-X Sportauspuff',
      'Motorschutz Trophy',
      'Schwarze Kreuzspeichenräder mit Geländebereifung',
      'Rot gefasste Akzente an Heckrahmen, Kühlerblenden, Handprotektoren und GEL-Sitzbank',
    ],
    text: [
      'Am Anfang stand die Verbeugung vor einer Ära, in der Motorräder für Wochen in der Wüste verschwanden. Für unsere neue Rallye Dakar nehmen wir die kompromisslose Langstrecken-Souveränität der BMW R 1300 GS Adventure und verschmelzen sie mit dem unverkennbaren Geist der frühen Dakar-Jahre. So entsteht kein Nachbau, sondern eine eigenständige Maschine.',
      'Der markante SC-Project Rallye X Sportauspuff schärft Silhouette und Sound des 145-PS-Boxers. Schwarze Kreuzspeichenräder mit Geländebereifung, der 30-Liter-Tank und die volle Assistenz-Elektronik der BMW R 1300 GS Adventure machen die Rallye Dakar zur Langstrecken-Interpretation des Dakar-Themas: souverän auf Asphalt, präzise im Gelände.',
      'Jede Rallye Dakar entsteht in aufwendiger Handarbeit als nummeriertes Unikat in streng limitierter Auflage.',
    ],
    journal: 'martin-edition-bmw-r-1300-gs-adventure-rallye-dakar',
  },
  {
    slug: 'r-1300-gs-adventure-hunter',
    basis: 'R 1300 GS Adventure',
    name: 'Hunter',
    familie: 'GS Adventure',
    akzent: '#8E9B63',
    bilder: 2,
    zeile: 'Oliv matt. Der Meister der Abenteuer.',
    teile: [
      'Lackierung in Oliv matt',
      'Akrapovič Sportauspuff Titan/Carbon',
      'Trophy-Unterfahrschutz',
      'Wunderlich Scheinwerferschutzgitter',
      'Individuell gestaltete Seitenverkleidungen, Tankabdeckungen und Kühlerblenden',
      'Hochgezogene Handprotektoren, überarbeitete Gabelbrücke, Sturzbügelblenden',
      'Getönte Windabweiser, Schutzgitter für Zusatzscheinwerfer',
      'Kühlerschutzgitter und Displayschutzfolie',
    ],
    text: [
      'In markantem Oliv matt signalisiert sie von weitem: Hier kommt kein gewöhnliches Motorrad. Die „Hunter“ ist das perfekte Werkzeug für Kenner und Abenteurer, die keine Grenzen akzeptieren.',
      'Individuell gestaltete Seitenverkleidungen, Tankabdeckungen und Kühlerblenden verleihen ihr ein unverwechselbares Erscheinungsbild. Hochgezogene Handprotektoren, eine überarbeitete Gabelbrücke sowie fein gefertigte Sturzbügelblenden verleihen der Maschine eine geschärfte Silhouette – und schützen gleichzeitig die wichtigen Bauteile, wenn es ernst wird.',
      'Der Trophy-Unterfahrschutz sowie das Wunderlich-Scheinwerferschutzgitter bieten zusätzliche Sicherheit – und der Akrapovič Sportauspuff liefert den unverkennbaren Sound.',
    ],
    journal: 'bmw-r-1300-gs-adventure-martin-edition-hunter',
  },
  {
    slug: 'r-1300-gs-adventure-black',
    basis: 'R 1300 GS Adventure',
    name: 'Black',
    familie: 'GS Adventure',
    akzent: '#F0852D',
    bilder: 2,
    zeile: 'Abenteuerlust in Schwarz.',
    teile: ['Auspuff schwarz matt', 'Motorschutz', 'GEL-Sitzbank'],
    journal: 'bmw-r-1300-gs-adventure-martin-edition',
  },
  {
    slug: 'r-1300-gs-rallye-dakar',
    basis: 'R 1300 GS',
    name: 'Rallye Dakar',
    familie: 'GS',
    akzent: '#E2392B',
    bilder: 2,
    zeile: 'Startnummer 22. Rot, Weiß, Titan.',
    teile: ['SC-Project Titan-Auspuff', 'Rizoma Kennzeichenhalter', 'Unterfahrschutz'],
  },
  {
    slug: 'r-1300-gs-triple-black',
    basis: 'R 1300 GS',
    name: 'Triple Black',
    familie: 'GS',
    akzent: '#E0537C',
    bilder: 2,
    zeile: 'Dreimal Schwarz, einmal Licht.',
    teile: ['Auspuff schwarz matt', 'Unterfahrschutz', 'LED-Zusatzscheinwerfer'],
  },
  {
    slug: 'r-1300-gs-black',
    basis: 'R 1300 GS',
    name: 'Black',
    familie: 'GS',
    akzent: '#C9CDD1',
    bilder: 2,
    zeile: 'Reduziert auf das Wesentliche.',
    teile: ['Auspuff schwarz matt', 'Unterfahrschutz', 'GEL-Sitzbank'],
  },
  {
    slug: 'r-1300-gs-gilles',
    basis: 'R 1300 GS',
    name: 'Gilles',
    familie: 'GS',
    akzent: '#B7BEC6',
    bilder: 2,
    zeile: 'Spiegel und Fußrasten von Gilles Tooling.',
    teile: ['Gilles Tooling Spiegel', 'Gilles Tooling Fußrasten', 'Unterfahrschutz', 'Auspuff schwarz matt'],
  },
  {
    slug: 'r-1300-gs-supermoto',
    basis: 'R 1300 GS',
    name: 'Supermoto',
    familie: 'GS',
    akzent: '#3D6BE8',
    bilder: 2,
    zeile: 'Die GS auf 17 Zoll.',
    teile: ['SC-Project Auspuff schwarz', 'Kineo Supermoto-Felgen 17 Zoll'],
  },
  {
    slug: 'r-1300-gs-supermoto-neon',
    basis: 'R 1300 GS',
    name: 'Supermoto Neon',
    familie: 'GS',
    akzent: '#D9F23C',
    bilder: 2,
    zeile: 'Neongelb gegen Mattschwarz.',
    teile: ['Akrapovič Auspuff', 'Rizoma LED-Blinker', 'Handschutz in Neongelb'],
  },
  {
    slug: 'r-12-gs-rallye-dakar',
    basis: 'R 12 G/S',
    name: 'Rallye Dakar',
    familie: 'R 12 G/S',
    akzent: '#E2392B',
    bilder: 2,
    zeile: 'High Pipe, Stollen, Startaufstellung.',
    teile: ['Unit Garage High-Pipe-Auspuff', 'Motorschutz', 'Handschutz'],
  },
  {
    slug: 'r-12-gs-rallye-dakar-blue',
    basis: 'R 12 G/S',
    name: 'Rallye Dakar Blue',
    familie: 'R 12 G/S',
    akzent: '#2F62E0',
    bilder: 2,
    zeile: 'Dieselbe Idee, in Blau.',
    teile: ['Arrow Indy Race Titan-Auspuff', 'Kineo Speichenfelgen', 'Unterfahrschutz'],
  },
  {
    slug: 'r-12-gs-rizoma',
    basis: 'R 12 G/S',
    name: 'Rizoma',
    familie: 'R 12 G/S',
    akzent: '#C3CAD2',
    bilder: 2,
    zeile: 'Silber, aufgeräumt, italienisch detailliert.',
    teile: ['Rizoma Spiegel', 'Rizoma Kennzeichenhalter', 'Rizoma Blinker', 'Unterfahrschutz'],
  },
  {
    slug: 'r-12-gs-black',
    basis: 'R 12 G/S',
    name: 'Black',
    familie: 'R 12 G/S',
    akzent: '#B9BEC2',
    bilder: 2,
    zeile: 'Schotter steht ihr.',
    teile: ['Akrapovič Auspuff', 'Tankdeckel', 'Fußrasten schwarz'],
  },
  {
    slug: 'r-12-ninet-big-foot',
    basis: 'R 12 nineT',
    name: 'Big Foot',
    familie: 'R 12 nineT',
    akzent: '#DDE2E6',
    bilder: 2,
    zeile: 'Kompromisslos, einzigartig, ein Unikat.',
    teile: ['Remus Power Cone Auspuff', 'SW-Motech Motorschutz', 'Rizoma Blinker'],
    journal: 'bmw-r-12-ninet-big-foot-fuer-hartmut-vom-chiemsee',
  },
  {
    slug: 'r-12-ninet-big-foot-military',
    basis: 'R 12 nineT',
    name: 'Big Foot Military',
    familie: 'R 12 nineT',
    akzent: '#7E8F5C',
    bilder: 2,
    zeile: 'Olivgrün, Stollen, Military Box.',
    teile: ['Remus Power Cone Auspuff', 'Wunderlich Unterfahrschutz', 'Military Box'],
  },
  {
    slug: 'r-12-ninet-grey',
    basis: 'R 12 nineT',
    name: 'Grey',
    familie: 'R 12 nineT',
    akzent: '#D2A85A',
    bilder: 2,
    zeile: 'Grau, Gold und Speichen.',
    teile: ['Akrapovič Auspuff schwarz', 'Kineo Speichenfelgen', 'Rizoma Kennzeichenhalter'],
  },
  {
    slug: 'r-ninet-90s-daytona',
    basis: 'R nineT',
    name: '90S Daytona',
    familie: 'R nineT',
    akzent: '#F28C1D',
    bilder: 2,
    zeile: 'Eine Verbeugung vor der R 90 S.',
    teile: ['R 90 S Verkleidung in Daytona Orange', 'Speichenfelgen', 'Auspuff Chrom'],
  },
  {
    slug: 'r-ninet-90s-red-smoke',
    basis: 'R nineT',
    name: '90S Red Smoke',
    familie: 'R nineT',
    akzent: '#C42A35',
    bilder: 2,
    zeile: 'Rauchrot, Chrom, Cockpitverkleidung.',
    teile: ['R 90 S Cockpitverkleidung', 'Speichenfelgen', 'Auspuff Chrom'],
  },
  {
    slug: 'r-ninet-100-rs',
    basis: 'R nineT',
    name: '100 RS',
    familie: 'R nineT',
    akzent: '#9DB3D6',
    bilder: 2,
    zeile: 'Vollverkleidung in Frozen Silver Blue.',
    teile: ['Verkleidung in Frozen Silver Blue', 'Speichenfelgen', 'Auspuff Chrom'],
  },
  {
    slug: 'r-18-bobber',
    basis: 'R 18',
    name: 'Bobber',
    familie: 'R 18',
    akzent: '#CFA862',
    bilder: 2,
    zeile: 'Big Spoke, Sidepipe, tiefe Linie.',
    teile: ['Hattech Sidepipe-Auspuff', 'Big Spoke 21 Zoll', 'Kennzeichenhalter seitlich'],
  },
  {
    slug: 'm-1000-rr-black',
    basis: 'M 1000 RR',
    name: 'Black',
    familie: 'Sport',
    akzent: '#5C92E6',
    bilder: 2,
    zeile: 'Carbon, matt, kompromisslos.',
    teile: ['Akrapovič Auspuff schwarz', 'Rizoma Spiegel', 'Carbon-Bugspoiler'],
    journal: 'fahrzeuguebergabe-in-weyarn-bmw-m1000rr-martin-edition-carbon-matt-fuer-marius-aus-wetter-an-der-ruhr',
  },
  {
    slug: 's-1000-rr-black',
    basis: 'S 1000 RR',
    name: 'Black',
    familie: 'Sport',
    akzent: '#E0463A',
    bilder: 2,
    zeile: 'Die RR, entfärbt und geschärft.',
    teile: ['SC-Project Auspuff Carbon', 'Rizoma Spiegel', 'Kennzeichenhalter'],
  },
  {
    slug: 's-1000-rr-m-sport',
    basis: 'S 1000 RR',
    name: 'M Sport',
    familie: 'Sport',
    akzent: '#4F86EA',
    bilder: 1,
    zeile: 'Motorsportfarben, Rennstreckenhaltung.',
    teile: [],
  },
];

export const editionen = roh.map((e, i) => ({
  ...e,
  nr: String(i + 1).padStart(2, '0'),
  titel: `BMW ${e.basis} Martin Edition ${e.name}`,
}));

export type EditionMitNr = (typeof editionen)[number];

export const edition = (slug: string) => editionen.find((e) => e.slug === slug)!;

/** Marken, deren Komponenten in den dokumentierten Umbauten verbaut wurden. */
export const komponenten = [
  'Akrapovič',
  'SC-Project',
  'Rizoma',
  'Kineo',
  'Gilles Tooling',
  'Wunderlich',
  'Remus',
  'Arrow',
  'Unit Garage',
  'Hattech',
  'SW-Motech',
  'Ilmberger Carbon',
  'Alpha Racing',
  'Wilbers',
  'Jekill & Hyde',
  'Metzeler',
];

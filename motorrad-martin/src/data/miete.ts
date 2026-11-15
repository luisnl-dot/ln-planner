/** Mietfahrzeuge 2026 – Preisliste von motorrad-martin.de, Stand 20.05.2026. */

export interface MietModell {
  modell: string;
  leistung: string; // kW/PS
  tag: number; // Tagespreis inkl. 300 km
  /** Fußnote 1: ab 23 Jahren, mind. 2 Jahre im Besitz des Führerscheins */
  ab23?: boolean;
  /** Erhöhte Selbstbeteiligung (5.000 €) */
  sb5000?: boolean;
  hinweis?: string;
}

export const mietflotte: { gruppe: string; modelle: MietModell[] }[] = [
  {
    gruppe: 'Urban Mobility',
    modelle: [
      { modell: 'CE 02', leistung: '11/16', tag: 79 },
      { modell: 'CE 04', leistung: '15/20', tag: 139 },
      { modell: 'C 400 X / C 400 GT', leistung: '25/34', tag: 79 },
    ],
  },
  {
    gruppe: 'Roadster',
    modelle: [
      { modell: 'G 310 R', leistung: '25/34', tag: 119 },
      { modell: 'F 900 R', leistung: '77/105', tag: 129 },
      { modell: 'R 1300 R', leistung: '107/145', tag: 189 },
      { modell: 'S 1000 R', leistung: '125/170', tag: 189 },
      { modell: 'M 1000 R', leistung: '154/210', tag: 299, ab23: true, sb5000: true },
    ],
  },
  {
    gruppe: 'Adventure',
    modelle: [
      { modell: 'G 310 GS', leistung: '25/34', tag: 119 },
      { modell: 'F 450 GS', leistung: '35/48', tag: 129 },
      { modell: 'F 800 GS', leistung: '64/87', tag: 139 },
      { modell: 'F 800 GS', leistung: '64/87', tag: 139, hinweis: 'tief' },
      { modell: 'F 900 GS', leistung: '77/105', tag: 149 },
      { modell: 'R 1300 GS', leistung: '107/145', tag: 189, hinweis: 'tief' },
      { modell: 'R 1300 GS', leistung: '107/145', tag: 189 },
      { modell: 'R 1300 GS Adventure', leistung: '107/145', tag: 209 },
    ],
  },
  {
    gruppe: 'Tour',
    modelle: [
      { modell: 'R 1300 RT', leistung: '107/145', tag: 249 },
      { modell: 'K 1600 GT / GTL', leistung: '118/160', tag: 249 },
    ],
  },
  {
    gruppe: 'Heritage',
    modelle: [
      { modell: 'R 12', leistung: '70/95', tag: 149 },
      { modell: 'R 12 nineT', leistung: '80/109', tag: 149 },
      { modell: 'R 12 G/S', leistung: '80/109', tag: 189 },
      { modell: 'R 18', leistung: '67/91', tag: 199 },
      { modell: 'R 18 Roctane', leistung: '67/91', tag: 229 },
      { modell: 'R 18 Bagger', leistung: '67/91', tag: 229 },
    ],
  },
  {
    gruppe: 'Sport',
    modelle: [
      { modell: 'F 900 XR', leistung: '77/105', tag: 139 },
      { modell: 'R 1300 RS', leistung: '107/145', tag: 189 },
      { modell: 'S 1000 XR', leistung: '125/170', tag: 179 },
      { modell: 'M 1000 XR', leistung: '147/201', tag: 299, ab23: true, sb5000: true },
      { modell: 'S 1000 RR', leistung: '154/210', tag: 239, ab23: true },
      { modell: 'M 1000 RR', leistung: '160/218', tag: 359, ab23: true, sb5000: true },
    ],
  },
];

export const mietRegeln = {
  stand: '20.05.2026',
  freiKmTag: 300,
  mehrKm: 0.7,
  reinigung: 25,
  kaution: 1500,
  sb: 2500,
  sbM: 5000,
  koffer: { tag: 6, min: 25 },
  navi: { tag: 25, fest: 60, festAb: 3 },
  dreiTage: { zahlen: 2, freiKm: 600 },
  woche: { zahlen: 5, freiKm: 1800 },
  halbtag: 0.5,
  zweiStunden: 0.3,
  laender: ['Deutschland', 'Österreich', 'Frankreich', 'Italien', 'Schweiz'],
};

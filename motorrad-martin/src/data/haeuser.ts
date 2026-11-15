/** Texte und Bilder der Standortseiten – Formulierungen von motorrad-martin.de. */
import type { StandortSlug } from './standorte';

export interface HausInhalt {
  titel: string[];
  held: string;
  heldAlt: string;
  fokus?: string;
  einleitung: string;
  absaetze: string[];
  leistungen: [string, string][];
  kennwerte: [string, string][];
  galerie: [string, string][];
}

export const haeuser: Record<StandortSlug, HausInhalt> = {
  weyarn: {
    titel: ['Weyarn'],
    held: 'standorte/weyarn-front',
    heldAlt: 'Glasfront des Motorradhauses BMW Martin in Weyarn mit Motorrädern davor',
    fokus: '50% 60%',
    einleitung: 'Seit Anfang 2022 ist der Betrieb Lenggries nach Weyarn umgezogen. Auf rund 3.500 Quadratmetern präsentieren wir Am Weiglfeld unser Motorradangebot.',
    absaetze: [
      'Der Standort liegt direkt an der A8 zwischen München und Salzburg. Aus Holzkirchen, Miesbach, Bad Tölz, dem Tegernseer Tal, Rosenheim und dem Münchner Süden sind Sie in wenigen Minuten bei uns.',
      'Wir führen fort, was die Familie Martin 1954 begonnen hat: Wir verkaufen kein Motorrad, das wir nicht selbst fahren würden.',
      'Wer über den Serienzustand hinaus denkt: In unserer Manufaktur entstehen die veredelten BMW Motorräder von Martin Edition – handmontiert, streng limitiert, jedes ein nummeriertes Einzelstück.',
    ],
    leistungen: [
      ['Probefahrt', 'Nach Vereinbarung – auf Wunsch auf Ihrer Hausstrecke.'],
      ['Inzahlungnahme', 'Faire Bewertung Ihrer aktuellen Maschine vor Ort.'],
      ['Zubehör & Bekleidung', 'Zubehörmontage und Bekleidungsberatung im Haus.'],
      ['Gebrauchte', 'Eine der größten Auswahlen gebrauchter BMW Motorräder in Oberbayern.'],
      ['Manufaktur', 'Home of Martin Edition – hier entstehen die Einzelstücke.'],
    ],
    kennwerte: [
      ['Fläche', 'rund 3.500 m²'],
      ['Am Standort seit', 'Anfang 2022'],
      ['Lage', 'A8 München – Salzburg'],
    ],
    galerie: [
      ['standorte/weyarn-luft', 'Luftaufnahme des Motorradhauses in Weyarn'],
      ['standorte/weyarn-showroom', 'Heller Showroom in Weyarn mit Blick auf die Berge'],
      ['standorte/weyarn-laden-2', 'Ausstellungsfläche mit Holzdecke und BMW Motorrädern'],
      ['standorte/weyarn-werkstatt', 'Zwei Mechaniker in der Werkstatt in Weyarn'],
      ['standorte/weyarn-halle-1', 'Halle mit gebrauchten BMW Motorrädern in Weyarn'],
      ['standorte/weyarn-eingang', 'Eingang des Motorradhauses in Weyarn im Abendlicht'],
    ],
  },
  schongau: {
    titel: ['Schongau'],
    held: 'standorte/schongau-front',
    heldAlt: 'Das Stammhaus Erwin Martin in der Marktoberdorfer Straße in Schongau',
    einleitung: 'In Schongau steht der Ursprung des Hauses Martin. Erwin Martin gründete den Betrieb am 1. April 1954, seit 1967 sind wir BMW Vertragspartner, seit 1969 auch für Motorräder.',
    absaetze: [
      'Über siebzig Jahre am selben Ort verpflichten. Wir kennen viele unserer Maschinen aus der eigenen Werkstatt, weil wir sie über Jahre betreut haben. Was wir über ein Motorrad wissen, erfahren Sie auch – vollständig und vor dem Kauf.',
      'Schongau liegt im Pfaffenwinkel, verkehrsgünstig zwischen Landsberg, Weilheim, Murnau, Peiting und Kaufbeuren. Aus dem westlichen Oberbayern und dem Ostallgäu erreichen Sie uns unkompliziert.',
      'Im PKW-Bereich sind wir freier Servicebetrieb mit Spezialisierung auf BMW und MINI.',
    ],
    leistungen: [
      ['Vertragswerkstatt', 'Computergestützte Motorraddiagnose und regelmäßig geschultes Personal.'],
      ['Originalteile', 'Zugriff auf über 24.000 BMW Originalteile – nicht Vorrätiges in der Regel innerhalb von 24 Stunden.'],
      ['Metallbearbeitung', 'Dreh-, Fräs- und Schweißtechnik für Arbeiten, die andernorts nicht mehr möglich sind.'],
      ['Hauptuntersuchung', 'TÜV und GTÜ im Haus – montags und donnerstags am Nachmittag.'],
      ['BMW Classic', 'Restaurierung und Instandsetzung klassischer BMW Motorräder.'],
      ['PKW-Service', 'Freier Servicebetrieb für BMW und MINI.'],
    ],
    kennwerte: [
      ['Gegründet', '1. April 1954'],
      ['BMW Vertragspartner', 'seit 1967'],
      ['BMW Motorrad', 'seit 1969'],
    ],
    galerie: [
      ['standorte/schongau-strasse', 'Straßenansicht des Betriebs in Schongau'],
      ['standorte/schongau-showroom-1', 'Showroom in Schongau mit BMW Motorrädern'],
      ['standorte/schongau-werkstatt-1', 'Motorrad auf der Hebebühne in der Werkstatt Schongau'],
      ['standorte/schongau-empfang', 'Empfang mit Kaffeebar in Schongau'],
      ['standorte/schongau-halle', 'Reihen von BMW Motorrädern in der Halle in Schongau'],
      ['standorte/schongau-teile', 'Teile- und Zubehörtheke in Schongau'],
    ],
  },
  'oy-mittelberg': {
    titel: ['Oy-Mittelberg'],
    held: 'standorte/oy-front',
    heldAlt: 'Der dunkle Neubau von BMW Martin in Oy-Mittelberg',
    einleitung: 'Oy-Mittelberg liegt dort, wo Motorradfahren Spaß macht: zwischen Oberallgäu, Tannheimer Tal und den Pässen des Allgäuer Alpenrands.',
    absaetze: [
      'Seit 1998 sind wir hier zu Hause, seit März 2018 in einem neuen Gebäude mit 1.000 Quadratmetern rund ums Motorrad.',
      'Hier ist ein Motorrad kein Stadtgerät. Wer bei uns Probe fährt, hat nach zehn Minuten Kurven unter dem Rad statt Ampeln – und weiß danach, ob die Maschine zu ihm passt.',
      'Aus Kempten, Sonthofen, Immenstadt, Füssen, Nesselwang und Marktoberdorf erreichen Sie uns in kurzer Zeit. Die Anfahrt aus dem Bodenseeraum und aus Tirol lohnt sich, und das Ausprobieren gleich mit.',
    ],
    leistungen: [
      ['Probefahrt', 'Auf Straßen, die etwas über ein Motorrad verraten.'],
      ['Inzahlungnahme', 'Wir bewerten Ihre aktuelle Maschine und rechnen sie an.'],
      ['Zubehör & Bekleidung', 'Motorrad- und Fahrerausstattung mit Beratung.'],
      ['Bestand', 'Über 100 Neu-, Dienst- und Gebrauchtmotorräder.'],
    ],
    kennwerte: [
      ['Fläche', '1.000 m²'],
      ['Im Allgäu seit', '1. Januar 1998'],
      ['Neubau', 'März 2018'],
    ],
    galerie: [
      ['standorte/oy-seite', 'Fassade des Neubaus in Oy-Mittelberg'],
      ['standorte/oy-showroom-2', 'Showroom mit Holzdachstuhl in Oy-Mittelberg'],
      ['standorte/oy-empfang', 'Empfangstheke in Oy-Mittelberg'],
      ['standorte/oy-showroom-1', 'Ausstellungsfläche mit Holzboden in Oy-Mittelberg'],
      ['standorte/oy-hof', 'Hof mit Motorrädern vor dem Gebäude in Oy-Mittelberg'],
    ],
  },
};

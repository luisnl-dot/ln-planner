/** Teams der drei Häuser – Namen, Funktionen und Durchwahlen wie auf motorrad-martin.de veröffentlicht. */
export interface Person { name: string; rolle: string; telefon: string }

export const team: Record<string, Person[]> = {
  "schongau": [
    {
      "name": "Georg Martin",
      "rolle": "Geschäftsführer",
      "telefon": "+49 8861 9300 0"
    },
    {
      "name": "Konny Martin",
      "rolle": "Leiterin Organisation und Systeme",
      "telefon": "+49 8861 9300 0"
    },
    {
      "name": "Christian Häußrer",
      "rolle": "Verkaufsberater",
      "telefon": "+49 8861 9300 18"
    },
    {
      "name": "Peter Kuhn",
      "rolle": "Verkaufsberater",
      "telefon": "+49 8861 9300 27"
    },
    {
      "name": "Christof Hübner",
      "rolle": "Leitung Teilevertrieb",
      "telefon": "+49 8861 9300 15"
    },
    {
      "name": "Max Schilcher",
      "rolle": "Leitung Service",
      "telefon": "+49 8861 9300 0"
    },
    {
      "name": "Holger Zwick",
      "rolle": "Serviceberater",
      "telefon": "+49 8861 9300 13"
    },
    {
      "name": "Mirko Klinder",
      "rolle": "Serviceberater",
      "telefon": "+49 8861 9300 281"
    },
    {
      "name": "Andrea Tamas-Havasi",
      "rolle": "kfm. Angestellte und Vermietungen",
      "telefon": "+49 8861 9300 0"
    },
    {
      "name": "Simona Krasteva",
      "rolle": "Auszubildende für Büromanagement",
      "telefon": "+49 8861 9300 0"
    },
    {
      "name": "Hans Popia",
      "rolle": "Kfz-Mechatroniker",
      "telefon": "+49 8861 9300 0"
    },
    {
      "name": "Emil Petrisor",
      "rolle": "Fahrzeugaufbereiter",
      "telefon": "+49 8861 9300 0"
    },
    {
      "name": "Andreas Wiedemann",
      "rolle": "Zweirad-Mechaniker",
      "telefon": "+49 8861 9300 0"
    },
    {
      "name": "Reinhard Wölfl",
      "rolle": "Zweirad-Mechaniker",
      "telefon": "+49 8861 9300 0"
    },
    {
      "name": "Sandor Füredi",
      "rolle": "Hausmeister",
      "telefon": "+49 8861 9300 0"
    },
    {
      "name": "Erna Pfann",
      "rolle": "Leitung Buchhaltung",
      "telefon": "+49 8861 9300 26"
    },
    {
      "name": "Gabi Höfler",
      "rolle": "Buchhaltung Schongau",
      "telefon": "+49 8861 9300 281"
    },
    {
      "name": "Birgit Rupprecht",
      "rolle": "Buchhaltung Schongau",
      "telefon": "+49 8861 9300 26"
    },
    {
      "name": "Vermietungen Schongau",
      "rolle": "Vermietungen",
      "telefon": "+49 8861 9300 0"
    }
  ],
  "weyarn": [
    {
      "name": "Patrick Martin",
      "rolle": "Geschäftsleitung und Verkauf",
      "telefon": "+49 8020 90450 0"
    },
    {
      "name": "Michael Kast",
      "rolle": "Stellvertretende Geschäftsleitung und Verkauf",
      "telefon": "+49 8020 90450 22"
    },
    {
      "name": "Nathalie S. J. Igler",
      "rolle": "Assistentin der Geschäftsleitung",
      "telefon": "+49 8020 90450 37"
    },
    {
      "name": "Sandra Köpferl",
      "rolle": "Serviceassistentin",
      "telefon": "+49 8020 90450 35"
    },
    {
      "name": "Sebastian Burz",
      "rolle": "Serviceassistent",
      "telefon": "+49 8020 90450 24"
    },
    {
      "name": "Florian Riesch",
      "rolle": "Verkaufsberater",
      "telefon": "+49 8020 90450 25"
    },
    {
      "name": "Dominik Schneider",
      "rolle": "Verkaufsberater",
      "telefon": "+49 8020 90450 33"
    },
    {
      "name": "Alexander Aschenbrenner",
      "rolle": "Serviceberater",
      "telefon": "+49 8020 90450 29"
    },
    {
      "name": "Marco Jopp",
      "rolle": "Teileverkauf",
      "telefon": "+49 8020 90450 23"
    },
    {
      "name": "Christian Weikert",
      "rolle": "Teileverkauf",
      "telefon": "+49 8020 90450 23"
    },
    {
      "name": "Gunnar Ruth",
      "rolle": "Werkstattmeister",
      "telefon": "+49 8020 90450 0"
    },
    {
      "name": "Alexander Becker",
      "rolle": "Zweirad-Mechaniker",
      "telefon": "+49 8020 90450 0"
    },
    {
      "name": "Henry Marksteiner",
      "rolle": "Zweirad-Mechaniker",
      "telefon": "+49 8020 90450 0"
    },
    {
      "name": "Nicola Pederzolli",
      "rolle": "Zweirad-Mechaniker",
      "telefon": "+49 8020 90450 0"
    },
    {
      "name": "Ionut Dobrogeanu",
      "rolle": "Zweirad-Mechaniker",
      "telefon": "+49 8020 90450 0"
    },
    {
      "name": "Carina Martin",
      "rolle": "Buchhaltung Weyarn",
      "telefon": "+49 8861 9300 21"
    },
    {
      "name": "Claudia Martin",
      "rolle": "Buchhaltung Weyarn",
      "telefon": "+49 8861 9300 26"
    },
    {
      "name": "Thomas Friedl",
      "rolle": "Aufbereiter",
      "telefon": "+49 8020 90450 0"
    },
    {
      "name": "Ahmed Al-Osami",
      "rolle": "Aufbereiter",
      "telefon": "+49 8020 90450 0"
    },
    {
      "name": "Jonas Wehner",
      "rolle": "Auszubildender / Zweiradmechatroniker",
      "telefon": "+49 8020 90450 0"
    },
    {
      "name": "Sebastian Fürg",
      "rolle": "Auszubildender / Zweiradmechatroniker",
      "telefon": "+49 8020 90450 0"
    },
    {
      "name": "Melvin Kruse",
      "rolle": "Auszubildender / Zweiradmechatroniker",
      "telefon": "+49 8020 90450 0"
    }
  ],
  "oy-mittelberg": [
    {
      "name": "Sebastian Martin",
      "rolle": "Geschäftsführer und Verkauf",
      "telefon": "+49 8366 98488 12"
    },
    {
      "name": "Manuela Kugler",
      "rolle": "Assistentin der Geschäftsleitung und Disposition",
      "telefon": "+49 8366 98488 19"
    },
    {
      "name": "Maximilian Schneider",
      "rolle": "Verkaufsleiter",
      "telefon": "+49 8366 98488 15"
    },
    {
      "name": "Wolfgang Haas",
      "rolle": "Leitung Service",
      "telefon": "+49 8366 98488 0"
    },
    {
      "name": "Bastian Weiske",
      "rolle": "Serviceleiter",
      "telefon": "+49 8366 98488 14"
    },
    {
      "name": "Angelika Martin",
      "rolle": "kfm. Mitarbeiterin",
      "telefon": "+49 8366 98488 12"
    },
    {
      "name": "Malik Blaize",
      "rolle": "Teilefachverkäufer",
      "telefon": "+49 8366 98488 13"
    },
    {
      "name": "Leo Schmied",
      "rolle": "Auszubildender Automobilkaufmann",
      "telefon": "+49 8366 98488 18"
    },
    {
      "name": "René Gohl",
      "rolle": "Zweiradmechatroniker",
      "telefon": "+49 8366 98488 0"
    },
    {
      "name": "Simon Meggle",
      "rolle": "Auszubildender Zweiradmechatroniker",
      "telefon": "+49 8366 98488 0"
    },
    {
      "name": "Drazen Grabovac",
      "rolle": "Zweiradmechatroniker",
      "telefon": "+49 8366 98488 0"
    },
    {
      "name": "Annina Michel",
      "rolle": "Auszubildende Zweiradmechatronikerin",
      "telefon": "+49 8366 98488 0"
    }
  ]
};

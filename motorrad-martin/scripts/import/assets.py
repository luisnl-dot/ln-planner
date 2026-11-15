"""Copies the curated photo selection from the downloaded originals into src/assets."""
import os, sys, subprocess
S, P = sys.argv[1], sys.argv[2]
K, RAW, A = S + '/img/kollektion', S + '/img/raw', P + '/src/assets'

def put(src, dst, maxw=1800, q=84):
    if not os.path.exists(src): print('MISSING', src); return
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    subprocess.run(['convert', src, '-auto-orient', '-strip', '-resize', f'{maxw}x{maxw}>', '-quality', str(q), dst], check=True)

EDITIONS = {
 'm-1000-rr-black': ('BMW_M_1000_RR_Martin_Edition_Black_1_Akrapovic_Auspuff_schwarz', 'BMW_M_1000_RR_Martin_Edition_Black_2_Rizoma_Spiegel_Carbon_Bugspoiler'),
 's-1000-rr-black': ('BMW_S_1000_RR_Martin_Edition_Black_1_SC-Project_Auspuff_Carbon', 'BMW_S_1000_RR_Martin_Edition_Black_2_Rizoma_Spiegel_Kennzeichenhalter'),
 's-1000-rr-m-sport': ('BMW_S_1000_RR_Edition_M_Sport',),
 'r-1300-gs-adventure-black': ('BMW_R_1300_GS_Adventure_Martin_Edition_Black_1_Auspuff_schwarz_matt', 'BMW_R_1300_GS_Adventure_Martin_Edition_Black_2_Motorschutz_GEL_Sitzbank'),
 'r-1300-gs-adventure-hunter': ('BMW_R_1300_GS_Adventure_Martin_Edition_Hunter_1_Akrapovic_Auspuff_Titan_Carbon', 'BMW_R_1300_GS_Adventure_Martin_Edition_Hunter_2_Unterfahrschutz_Wunderlich_Schutzgitter'),
 'r-1300-gs-adventure-rallye-dakar': ('BMW_R_1300_GS_Adventure_Martin_Edition_Rallye_Dakar_1_SC-Project_Rally-X_Auspuff', 'BMW_R_1300_GS_Adventure_Martin_Edition_Rallye_Dakar_2_Motorschutz_Trophy'),
 'r-1300-gs-black': ('BMW_R_1300_GS_Martin_Edition_Black_1_Auspuff_schwarz_matt', 'BMW_R_1300_GS_Martin_Edition_Black_2_Unterfahrschutz_GEL_Sitzbank'),
 'r-1300-gs-gilles': ('BMW_R_1300_GS_Martin_Edition_Gilles_1_Gilles_Tooling_Spiegel_Fussrasten', 'BMW_R_1300_GS_Martin_Edition_Gilles_2_Unterfahrschutz_Auspuff_schwarz_matt'),
 'r-1300-gs-rallye-dakar': ('BMW_R_1300_GS_Martin_Edition_Rallye_Dakar_1_SC-Project_Titan_Auspuff', 'BMW_R_1300_GS_Martin_Edition_Rallye_Dakar_2_Rizoma_Kennzeichenhalter_Unterfahrschutz'),
 'r-1300-gs-supermoto': ('BMW_R_1300_GS_Martin_Edition_Supermoto_1_SC-Project_Auspuff_schwarz', 'BMW_R_1300_GS_Martin_Edition_Supermoto_2_Kineo_Supermoto_Felgen_17_Zoll'),
 'r-1300-gs-supermoto-neon': ('BMW_R_1300_GS_Martin_Edition_Supermoto_Neon_1_Akrapovic_Auspuff', 'BMW_R_1300_GS_Martin_Edition_Supermoto_Neon_2_Rizoma_LED_Blinker_Handschutz_Neongelb'),
 'r-1300-gs-triple-black': ('BMW_R_1300_GS_Martin_Edition_Triple_Black_1_Auspuff_schwarz_matt', 'BMW_R_1300_GS_Martin_Edition_Triple_Black_2_Unterfahrschutz_LED_Zusatzscheinwerfer'),
 'r-12-gs-black': ('BMW_R_12_GS_Martin_Edition_Black_1_Akrapovic_Auspuff', 'BMW_R_12_GS_Martin_Edition_Black_2_Tankdeckel_Fussrasten_schwarz'),
 'r-12-gs-rallye-dakar': ('BMW_R_12_GS_Martin_Edition_Rallye_Dakar_1_Unit_Garage_High_Pipe_Auspuff', 'BMW_R_12_GS_Martin_Edition_Rallye_Dakar_2_Motorschutz_Handschutz'),
 'r-12-gs-rallye-dakar-blue': ('BMW_R_12_GS_Martin_Edition_Rallye_Dakar_Blue_1_Arrow_Indy_Race_Titan_Auspuff', 'BMW_R_12_GS_Martin_Edition_Rallye_Dakar_Blue_2_Kineo_Speichenfelgen_Unterfahrschutz'),
 'r-12-gs-rizoma': ('BMW_R_12_GS_Martin_Edition_Rizoma_1_Rizoma_Spiegel_Kennzeichenhalter', 'BMW_R_12_GS_Martin_Edition_Rizoma_2_Rizoma_Blinker_Unterfahrschutz'),
 'r-12-ninet-big-foot': ('BMW_R_12_nineT_Martin_Edition_Big_Foot_1_Remus_Power_Cone_Auspuff', 'BMW_R_12_nineT_Martin_Edition_Big_Foot_2_SW-Motech_Motorschutz_Rizoma_Blinker'),
 'r-12-ninet-big-foot-military': ('BMW_R_12_nineT_Martin_Edition_Big_Foot_Military_1_Remus_Power_Cone_Auspuff', 'BMW_R_12_nineT_Martin_Edition_Big_Foot_Military_2_Wunderlich_Unterfahrschutz_Military_Box'),
 'r-12-ninet-grey': ('BMW_R_12_nineT_Martin_Edition_Grey_1_Akrapovic_Auspuff_schwarz', 'BMW_R_12_nineT_Martin_Edition_Grey_2_Kineo_Speichenfelgen_Rizoma_Kennzeichenhalter'),
 'r-18-bobber': ('BMW_R_18_Martin_Edition_Bobber_1_Hattech_Sidepipe_Auspuff', 'BMW_R_18_Martin_Edition_Bobber_2_Big_Spoke_21_Zoll_Kennzeichenhalter_seitlich'),
 'r-ninet-90s-daytona': ('BMW_R_nineT_Martin_Edition_90S_Daytona_1_R90S_Verkleidung_Daytona_Orange', 'BMW_R_nineT_Martin_Edition_90S_Daytona_2_Speichenfelgen_Auspuff_Chrom'),
 'r-ninet-90s-red-smoke': ('BMW_R_nineT_Martin_Edition_90S_Red_Smoke_1_R90S_Cockpitverkleidung', 'BMW_R_nineT_Martin_Edition_90S_Red_Smoke_2_Speichenfelgen_Auspuff_Chrom'),
 'r-ninet-100-rs': ('BMW_R_nineT_Martin_Edition_100_RS_1_Verkleidung_Frozen_Silver_Blue', 'BMW_R_nineT_Martin_Edition_100_RS_2_Speichenfelgen_Auspuff_Chrom'),
}
for slug, files in EDITIONS.items():
    for i, f in enumerate(files, 1):
        put(f'{K}/{f}.jpg', f'{A}/editionen/{slug}-{i}.jpg', 1800, 86)

W, SG, OY = 'Weyarn__', 'Schongau__', 'OY-Mittelberg__'
PICKS = {
 # Weyarn
 'standorte/weyarn-eingang': W + 'Betrieb__BMW-Martin-Weyarn-2022_064',
 'standorte/weyarn-front': W + 'Betrieb__BMW-Martin-Weyarn-2022_072',
 'standorte/weyarn-luft': W + 'Betrieb__BMW-Martin-Weyarn-2022_080',
 'standorte/weyarn-seite': W + 'Betrieb__BMW-Martin-Weyarn-2022_085',
 'standorte/weyarn-zeichen': W + 'Betrieb__BMW-Martin-Weyarn-2022_094',
 'standorte/weyarn-showroom': W + 'Betrieb__bmw-motorrad-martin-weyarn-karriere-buchhalter-showroom',
 'standorte/weyarn-werkstatt': W + 'Betrieb__bmw-motorrad-martin-weyarn-karriere-serviceassistent-werkstatt',
 'standorte/weyarn-beratung': W + 'Betrieb__bmw-motorrad-martin-weyarn-karriere-serviceberater-beratung',
 'standorte/weyarn-hof': W + 'Betrieb__bmw-motorrad-martin-weyarn-karriere-serviceberater',
 'standorte/weyarn-laden-1': W + 'Laden__BMW-Martin-Weyarn-2022_005',
 'standorte/weyarn-laden-2': W + 'Laden__BMW-Martin-Weyarn-2022_009',
 'standorte/weyarn-laden-3': W + 'Laden__BMW-Martin-Weyarn-2022_012',
 'standorte/weyarn-laden-4': W + 'Laden__BMW-Martin-Weyarn-2022_015',
 'standorte/weyarn-halle-1': W + 'Gebrauchte__BMW-Martin-Weyarn-2022_036',
 'standorte/weyarn-halle-2': W + 'Gebrauchte__BMW-Martin-Weyarn-2022_043',
 # Schongau
 'standorte/schongau-front': SG + 'Betrieb__bmw-martin_juli13_036',
 'standorte/schongau-strasse': SG + 'Betrieb__bmw-martin_juli13_031a',
 'standorte/schongau-empfang': SG + 'Betrieb__bmw-martin-2017_01',
 'standorte/schongau-showroom-1': SG + 'Betrieb__bmw-martin-2017_03',
 'standorte/schongau-showroom-2': SG + 'Betrieb__bmw-martin-2017_06',
 'standorte/schongau-teile': SG + 'Betrieb__bmw-martin-2017_07',
 'standorte/schongau-halle': SG + 'Betrieb__bmw-martin-2017_11',
 'standorte/schongau-werkstatt-1': SG + 'Werkstatt__bmw-martin-werkstatt-05',
 'standorte/schongau-werkstatt-2': SG + 'Werkstatt__bmw-martin-werkstatt-07',
 # Oy-Mittelberg
 'standorte/oy-front': OY + 'Betrieb__bmw-martin-oy-kempten_01',
 'standorte/oy-seite': OY + 'Betrieb__-bmw-martin-oy-kempten_06',
 'standorte/oy-hof': OY + 'Betrieb__-bmw-martin-oy-kempten_05',
 'standorte/oy-showroom-1': OY + 'Betrieb__bmw-martin-oy-kempten_02',
 'standorte/oy-showroom-2': OY + 'Betrieb__bmw-martin-oy-kempten_03',
 'standorte/oy-empfang': OY + 'Betrieb__bmw-martin-oy-kempten_04',
 'standorte/oy-neubau': OY + 'Betrieb__bmw-martin-oy-kempten_08',
 # Haus / Classic / Chronik
 'haus/classic-schongau': 'Oldtimer__-bmw-martin-classic-schongau',
 'haus/classic-firma': 'Oldtimer__-bmw-martin-firma-schongau',
 'haus/classic-r32': 'Oldtimer__eicma12_218',
 'haus/classic-vorkrieg': 'Oldtimer__bmw-martin_juli13_009',
 'haus/classic-sattel': 'Oldtimer__bmw-martin_juli13_011',
 'haus/classic-rad': 'Oldtimer__bmw-martin_juli13_014',
 'haus/classic-treffen': 'Oldtimer__BMW-days12_077',
 'haus/weyarn-bau-1': W + 'History__BMW-Martin-Wweyarn_100',
 'haus/weyarn-bau-2': W + 'History__BMW-Martin-Wweyarn_102',
 'haus/weyarn-bau-3': W + 'History__BMW-Martin-Wweyarn_105',
 'haus/weyarn-bau-nacht': W + 'History__BMW-Martin-Weyarn-2021-01',
}
for dst, src in PICKS.items():
    put(f'{RAW}/{src}.jpg', f'{A}/{dst}.jpg', 1600, 80)

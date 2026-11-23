#!/usr/bin/env python3
"""Baut die Instagram-Präsentation als EINE HTML-Datei.

Schriften, Fotos und Reels werden eingebettet, die Datei läuft also ohne Internet,
per Doppelklick im Browser. Jedes Bild steht nur einmal in der Datei (Medien-Tabelle),
auch wenn es auf mehreren Folien vorkommt.

Aufruf aus motorrad-martin/:  python3 social/praesentation/bauen.py
Voraussetzung: die Exporte unter social/export/ (node social/render.cjs, node social/reel.cjs …),
Pillow und ffmpeg.
Ausgabe:       social/export/praesentation/martin-instagram-praesentation.html
"""
import base64
import io
import json
import re
import subprocess
import tempfile
from pathlib import Path

from PIL import Image

HIER = Path(__file__).resolve().parent
PROJEKT = HIER.parent.parent
EXPORT = PROJEKT / 'social' / 'export'
ZIEL = EXPORT / 'praesentation' / 'martin-instagram-praesentation.html'

SCHRIFTEN = {
    'archivo': 'src/assets/fonts/archivo-latin-wdth-normal.woff2',
    'archivo-ext': 'src/assets/fonts/archivo-latin-ext-wdth-normal.woff2',
    'plex400': 'src/assets/fonts/ibm-plex-mono-latin-400-normal.woff2',
    'plex500': 'src/assets/fonts/ibm-plex-mono-latin-500-normal.woff2',
}

# Fotos: Quelle, Zielbreite, Seitenverhältnis (Breite/Höhe) oder None, Fokus (x, y)
FOTOS = {
    'cover': ('src/assets/editionen/r-1300-gs-triple-black-2.jpg', 1300, 1120 / 1080, (0.5, 0.5)),
    'kapitel1': ('src/assets/editionen/r-1300-gs-adventure-hunter-1.jpg', 1800, 16 / 9, (0.5, 0.62)),
    'kapitel2': ('src/assets/editionen/m-1000-rr-black-2.jpg', 1800, 16 / 9, (0.5, 0.6)),
    'kapitel3': ('src/assets/standorte/weyarn-werkstatt.jpg', 1600, 16 / 9, (0.5, 0.35)),
    'website': ('social/praesentation/bilder/website-hero.jpg', 1200, None, (0.5, 0.5)),
    'profil': ('social/export/profil/profilvorschau.png', 720, 1080 / 1560, (0.5, 0.0)),
}


def daten_uri(mime: str, roh: bytes) -> str:
    return f'data:{mime};base64,' + base64.b64encode(roh).decode('ascii')


def bild(pfad: Path, breite: int, verh=None, fokus=(0.5, 0.5), qualitaet=82) -> str:
    im = Image.open(pfad).convert('RGB')
    if verh:
        w, h = im.size
        if w / h > verh:
            nw = round(h * verh)
            x = round((w - nw) * fokus[0])
            im = im.crop((x, 0, x + nw, h))
        else:
            nh = round(w / verh)
            y = round((h - nh) * fokus[1])
            im = im.crop((0, y, w, y + nh))
    if im.width > breite:
        im = im.resize((breite, round(im.height * breite / im.width)), Image.LANCZOS)
    puffer = io.BytesIO()
    im.save(puffer, 'JPEG', quality=qualitaet, optimize=True, progressive=True)
    return daten_uri('image/jpeg', puffer.getvalue())


def video(pfad: Path) -> str:
    with tempfile.TemporaryDirectory() as tmp:
        ziel = Path(tmp) / 'v.mp4'
        subprocess.run(
            ['ffmpeg', '-y', '-loglevel', 'error', '-i', str(pfad), '-vf', 'scale=540:960', '-c:v', 'libx264',
             '-preset', 'slow', '-crf', '26', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', str(ziel)],
            check=True,
        )
        return daten_uri('video/mp4', ziel.read_bytes())


def medium(schluessel: str) -> str:
    art, name = schluessel.split(':', 1)
    if art == 'foto':
        quelle, breite, verh, fokus = FOTOS[name]
        return bild(PROJEKT / quelle, breite, verh, fokus)
    if art == 'post':
        return bild(EXPORT / 'feed-4x5' / f'{name}.jpg', 760)
    if art == 'story':
        return bild(EXPORT / 'stories-9x16' / f'{name}.jpg', 600)
    if art == 'poster':
        return bild(EXPORT / 'reels-9x16' / f'{name}-cover.jpg', 560)
    if art == 'video':
        return video(EXPORT / 'reels-9x16' / f'{name}.mp4')
    raise KeyError(schluessel)


def main() -> None:
    vorlage = (HIER / 'vorlage.html').read_text(encoding='utf-8')
    schluessel = sorted(set(re.findall(r'data-(?:bild|poster|video)="([^"]+)"', vorlage)))
    medien = {k: medium(k) for k in schluessel}
    html = vorlage.replace('{{MEDIEN}}', json.dumps(medien, separators=(',', ':')))

    def schrift(m: re.Match) -> str:
        return daten_uri('font/woff2', (PROJEKT / SCHRIFTEN[m.group(1)]).read_bytes())

    html = re.sub(r'\{\{f:([a-z0-9-]+)\}\}', schrift, html)
    rest = re.findall(r'\{\{[^}]+\}\}', html)
    if rest:
        raise SystemExit(f'Nicht ersetzt: {rest}')
    ZIEL.parent.mkdir(parents=True, exist_ok=True)
    ZIEL.write_text(html, encoding='utf-8')
    print(f'{ZIEL.relative_to(PROJEKT)}  {len(schluessel)} Medien  {ZIEL.stat().st_size / 1e6:.1f} MB')


if __name__ == '__main__':
    main()

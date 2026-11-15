#!/usr/bin/env python3
"""Baut die Pitch-Präsentation als eine einzige, offline lauffähige HTML-Datei.
Aufruf:  python3 pitch/bmw-martin/src/build.py
"""
import base64, glob, json, os

SRC = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SRC, "..", "BMW-Martin_Pitch_LN-Social.html")


def read(name):
    with open(os.path.join(SRC, name), encoding="utf-8") as f:
        return f.read()


def b64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()


imgs = {
    os.path.splitext(os.path.basename(p))[0]: "data:image/webp;base64," + b64(p)
    for p in sorted(glob.glob(os.path.join(SRC, "img", "*.webp")))
}
css = read("deck.css").replace(
    "__FONT__", "data:font/woff2;base64," + b64(os.path.join(SRC, "archivo.woff2"))
)
html = f"""<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Serie endet in Weyarn · LN Social für BMW Martin</title>
<style>
{css}
</style>
</head>
<body>
{read("deck.html")}
<script>
var IMG={json.dumps(imgs)};
{read("deck.js")}
</script>
</body>
</html>
"""
with open(OUT, "w", encoding="utf-8") as f:
    f.write(html)
print(f"{os.path.normpath(OUT)}  {len(html) / 1e6:.2f} MB  ({len(imgs)} Bilder)")

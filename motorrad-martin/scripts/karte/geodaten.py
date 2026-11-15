"""
Bereitet die Geodaten für die Revierkarte auf (einmalig, offline).

Quellen (öffentlich, frei nutzbar):
  - Landesgrenzen: Natural Earth 1:10m über das npm-Paket world-atlas@2 (countries-10m.json)
  - Seen und Flüsse: npm-Pakete @geo-maps/earth-lakes-10m und @geo-maps/earth-rivers-10m

Aufruf:  python3 geodaten.py <countries-10m.json> <lakes.geo.json> <ungenutzt> <ausgabe.json>

Flüsse, Straßen, Orte und Gipfel stehen als Koordinaten in src/data/karte-ebenen.ts
(vereinfachte Verläufe über bekannte Wegpunkte).
Ergebnis: projizierte, vereinfachte SVG-Pfade für src/data/karte.json
"""
import json, math, sys

# Kartenausschnitt (Länge, Breite) und Projektion: abstandstreue Zylinderprojektion mit
# Breitenkorrektur – auf diesem kleinen Ausschnitt praktisch verzerrungsfrei.
LNG0, LNG1, LAT0, LAT1 = 9.62, 13.1, 47.22, 48.42
KX = math.cos(math.radians((LAT0 + LAT1) / 2))
W = 1200
H = round(W * (LAT1 - LAT0) / ((LNG1 - LNG0) * KX))

def px(lng, lat):
    return ((lng - LNG0) / (LNG1 - LNG0) * W, (LAT1 - lat) / (LAT1 - LAT0) * H)

def inside(lng, lat, m=0.25):
    return LNG0 - m <= lng <= LNG1 + m and LAT0 - m <= lat <= LAT1 + m

def simplify(pts, tol):
    """Douglas-Peucker in Pixeln. Geschlossene Ringe werden am entferntesten Punkt geteilt."""
    if len(pts) < 3: return pts
    if math.dist(pts[0], pts[-1]) < 1e-6:
        far = max(range(len(pts)), key=lambda i: math.dist(pts[0], pts[i]))
        if far == 0: return pts[:1]
        return simplify(pts[:far + 1], tol)[:-1] + simplify(pts[far:], tol)
    def rec(a, b):
        (x1, y1), (x2, y2) = pts[a], pts[b]
        dx, dy = x2 - x1, y2 - y1
        n = math.hypot(dx, dy) or 1e-9
        best, idx = 0, None
        for i in range(a + 1, b):
            x, y = pts[i]
            d = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / n
            if d > best: best, idx = d, i
        if idx is not None and best > tol:
            return rec(a, idx)[:-1] + rec(idx, b)
        return [pts[a], pts[b]]
    return rec(0, len(pts) - 1)

def path(pts, closed=False, tol=0.6):
    pts = simplify([px(*p) for p in pts], tol)
    if len(pts) < 2: return ''
    d = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts)
    return d + ('Z' if closed else '')

def pfade_aus_teilen(teile, closed, tol, min_len=0):
    aus = []
    for t in teile:
        pts = [p for p in t if inside(*p)] if not closed else t
        if not closed:
            # Linien an Ausschnittgrenzen auftrennen
            stueck, stuecke = [], []
            for p in t:
                if inside(*p): stueck.append(p)
                else:
                    if len(stueck) > 1: stuecke.append(stueck)
                    stueck = []
            if len(stueck) > 1: stuecke.append(stueck)
            for s in stuecke:
                lang = sum(math.dist(px(*a), px(*b)) for a, b in zip(s, s[1:]))
                if lang >= min_len: aus.append(path(s, False, tol))
        else:
            if any(inside(*p, 0) for p in t): aus.append(path(t, True, tol))
    return [a for a in aus if a]

# ---------- Grenzen aus TopoJSON ----------
def grenzen(datei):
    topo = json.load(open(datei))
    sc, tr = topo['transform']['scale'], topo['transform']['translate']
    arcs = []
    for arc in topo['arcs']:
        x = y = 0; pts = []
        for dx, dy in arc:
            x += dx; y += dy
            pts.append((x * sc[0] + tr[0], y * sc[1] + tr[1]))
        arcs.append(pts)
    def arc_ids(geom):
        ids = set()
        def walk(a):
            if isinstance(a, int): ids.add(a if a >= 0 else ~a)
            else:
                for b in a: walk(b)
        walk(geom['arcs'])
        return ids
    laender = {g.get('id'): arc_ids(g) for g in topo['objects']['countries']['geometries'] if g.get('id') in ('276', '040', '756', '438', '380')}
    paare = [('276', '040'), ('276', '756'), ('040', '756'), ('040', '438'), ('756', '438'), ('040', '380')]
    linien = []
    for a, b in paare:
        for i in sorted(laender.get(a, set()) & laender.get(b, set())):
            linien.append(arcs[i])
    return pfade_aus_teilen(linien, False, 0.5)

def geo_teile(datei, polygon):
    d = json.load(open(datei))
    if 'features' in d: geoms = [f['geometry'] for f in d['features']]
    elif 'geometries' in d: geoms = d['geometries']
    else: geoms = [d.get('geometry', d)]
    teile = []
    for g in geoms:
        c = g['coordinates']
        if g['type'] == 'Polygon': polys = [c]
        elif g['type'] == 'MultiPolygon': polys = c
        elif g['type'] == 'LineString': polys = [[c]]
        elif g['type'] == 'MultiLineString': polys = [[l] for l in c]
        else: continue
        for poly in polys:
            ring = poly[0]
            xs = [p[0] for p in ring]; ys = [p[1] for p in ring]
            if max(xs) < LNG0 - .3 or min(xs) > LNG1 + .3 or max(ys) < LAT0 - .3 or min(ys) > LAT1 + .3: continue
            teile.append([tuple(p[:2]) for p in ring])
    return teile

if __name__ == '__main__':
    land, seen, fluesse, ziel = sys.argv[1:5]
    seen_teile = geo_teile(seen, True)
    # nur Seen, die auf der Karte sichtbar sind (> ~6 px Ausdehnung)
    seen_teile = [t for t in seen_teile if (lambda pts: max(math.dist(pts[0], q) for q in pts))([px(*p) for p in t]) > 5]
    daten = {
        'breite': W, 'hoehe': H,
        'ausschnitt': [LNG0, LNG1, LAT0, LAT1],
        'grenzen': grenzen(land),
        'seen': pfade_aus_teilen(seen_teile, True, 0.35),
        # Seen als Punktlisten (Pixel), damit die Komponente sie weich zeichnen kann
        'seenPunkte': [[[round(x, 1), round(y, 1)] for x, y in simplify([px(*p) for p in t], 0.25)] for t in seen_teile],
    }
    json.dump(daten, open(ziel, 'w'), separators=(',', ':'))
    del daten['seen']
    print(f"{W}x{H}  Grenzen {len(daten['grenzen'])}  Seen {len(daten['seenPunkte'])}  Größe {len(json.dumps(daten))//1024} KB")

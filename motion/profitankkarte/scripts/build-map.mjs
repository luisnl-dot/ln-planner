// Builds the dot-matrix Europe map used in the "2.200 Stationen" scene.
// Output: src/data/europe-dots.json (screen-space coordinates for a 1920x1080 stage).
// Station dots are illustrative (weighted by country), not real station locations.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { geoAzimuthalEqualArea, geoContains } from "d3-geo";
import { feature, merge } from "topojson-client";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const world = JSON.parse(
  readFileSync(join(root, "node_modules/world-atlas/countries-50m.json"), "utf8"),
);

const W = 1920;
const H = 1080;
const SPACING = 12; // px between dots

// Centre the projection on Germany, pushed right so the Atlantic leaves room for text.
const projection = geoAzimuthalEqualArea()
  .rotate([-12, -51.5])
  .scale(1750)
  .translate([1250, 560]);

const geoms = world.objects.countries.geometries;
const land = merge(world, geoms);
const countries = new Map(geoms.map((g) => [g.id, feature(world, g)]));
const germany = countries.get("276");

// Weight = probability that a land dot in this country becomes a station dot.
const WEIGHTS = {
  "276": 0.6, // Deutschland
  "528": 0.2, "056": 0.2, "442": 0.2, "040": 0.18, "756": 0.12, "208": 0.18,
  "616": 0.12, "203": 0.14, "250": 0.1,
  "380": 0.05, "724": 0.04, "620": 0.04, "826": 0.03, "372": 0.03, "752": 0.035,
  "578": 0.03, "246": 0.03, "703": 0.06, "348": 0.05, "705": 0.06, "191": 0.04,
  "642": 0.03, "100": 0.03, "440": 0.05, "428": 0.05, "233": 0.05, "300": 0.025,
  "688": 0.03, "070": 0.03, "499": 0.03, "807": 0.03, "008": 0.03,
};
const weighted = Object.keys(WEIGHTS).map((id) => [id, countries.get(id)]);

// Deterministic PRNG so the map is identical on every build.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(2200);

const p = (lon, lat) => projection([lon, lat]).map((v) => Math.round(v * 10) / 10);
const origin = p(9.43, 54.78); // Flensburg, Sitz von team

const dots = [];
const stations = [];
const margin = SPACING * 2;
for (let y = -margin; y <= H + margin; y += SPACING) {
  // Offset every other row for a denser, more organic hex-like grid.
  const offset = (Math.round(y / SPACING) % 2) * (SPACING / 2);
  for (let x = -margin + offset; x <= W + margin; x += SPACING) {
    const ll = projection.invert([x, y]);
    if (!ll || !geoContains(land, ll)) continue;
    const dist = Math.hypot(x - origin[0], y - origin[1]);
    const isDE = geoContains(germany, ll) ? 1 : 0;
    dots.push([x, y, Math.round(dist), isDE]);
    for (const [id, f] of weighted) {
      if (geoContains(f, ll)) {
        if (rand() < WEIGHTS[id]) stations.push([x, y, Math.round(dist), Math.round(rand() * 1000) / 1000]);
        break;
      }
    }
  }
}

const hubs = {
  hamburg: p(10.0, 53.55),
  muenchen: p(11.58, 48.14),
  mailand: p(9.19, 45.46),
  rotterdam: p(4.48, 51.92),
  warschau: p(21.01, 52.23),
  kopenhagen: p(12.57, 55.68),
  wien: p(16.37, 48.21),
  lyon: p(4.84, 45.76),
  koeln: p(6.96, 50.94),
  berlin: p(13.4, 52.52),
  flensburg: origin,
};

const routes = [
  ["hamburg", "muenchen", "mailand"],
  ["rotterdam", "koeln", "berlin", "warschau"],
  ["kopenhagen", "hamburg", "koeln", "lyon"],
  ["berlin", "wien"],
];

const deBounds = (() => {
  // Screen-space bbox of Germany for the camera push-in.
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y, , isDE] of dots) {
    if (isDE) {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
  }
  return [x0, y0, x1, y1];
})();

mkdirSync(join(root, "src/data"), { recursive: true });
writeFileSync(
  join(root, "src/data/europe-dots.json"),
  JSON.stringify({ w: W, h: H, spacing: SPACING, origin, hubs, routes, deBounds, dots, stations }),
);
console.log(`dots: ${dots.length}, stations: ${stations.length}, germany bbox: ${deBounds}`);

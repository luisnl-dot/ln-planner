/* global gsap */
// profitankkarte.de · Motion-Design-Video (1920x1080)
// Deterministisch: window.__seek(t) zeichnet exakt den Zustand zum Zeitpunkt t (Sekunden).
// GSAP steuert DOM-Bewegungen, Canvas/Zähler/Tippen sind reine Funktionen der Zeit.

const W = 1920;
const H = 1080;
const RED = "#E31E24";
const params = new URLSearchParams(location.search);
const RENDER = params.has("render");

// Szenenplan in Sekunden, auf 120 BPM gelegt (1 Takt = 2 s).
const T = { s1: 0, s2: 4, s3: 8, s4: 14, s5: 19, s6: 25, s7: 30, s8: 35, s9: 43, end: 48 };

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  outCubic: (x) => 1 - Math.pow(1 - x, 3),
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  inOutExpo: (x) =>
    x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2,
  outBack: (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
  inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  inOutQuart: (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2),
};
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const fmtDE = (n, d = 0) =>
  n.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });

// Sound-Cues: werden beim Aufbau der Timeline gesammelt und vom Audio-Skript gelesen.
const cues = [];
// Zeitfenster mit sehr schneller Bewegung: der Renderer nimmt dort mehr Subframes.
const FAST = [[3.35, 4.55], [8.28, 8.75], [18.5, 19.66], [42.4, 44.0]];
const cue = (type, t, extra = {}) => cues.push({ type, t: Math.round(t * 1000) / 1000, ...extra });

const stage = $("#stage");
const tl = gsap.timeline({ paused: true });
const M = {}; // gemessene Layout-Positionen
let MAP = null;

/* ------------------------------------------------------------------ helpers */

function show(sel, from, to) {
  tl.set(sel, { autoAlpha: 1 }, from);
  tl.set(sel, { autoAlpha: 0 }, to);
}
function reveal(sel, at, stagger = 0.08, dur = 0.95) {
  tl.fromTo(sel, { yPercent: 120 }, { yPercent: 0, duration: dur, ease: "expo.out", stagger }, at);
}
function conceal(sel, at, stagger = 0.04, dur = 0.42) {
  tl.to(sel, { yPercent: -120, duration: dur, ease: "power3.in", stagger }, at);
}
function bg(color, at) {
  tl.set("#bg", { backgroundColor: color }, at);
}
function drawIcon(target, at, dur = 0.6) {
  const el = typeof target === "string" ? $(target) : target;
  const shapes = el.querySelectorAll("path,circle,rect,line,polyline,polygon,ellipse");
  gsap.set(shapes, { strokeDasharray: "1 2", strokeDashoffset: 1.01, opacity: 0 });
  tl.set(shapes, { opacity: 1 }, at);
  tl.to(shapes, { strokeDashoffset: 0, duration: dur, ease: "power2.out", stagger: dur * 0.1 }, at);
}
// Zwei Farbbalken (rot voraus, dann die nächste Hintergrundfarbe) überdecken den Schnitt.
function wipe(at, color, fromRight = false) {
  const origin = fromRight ? "right center" : "left center";
  tl.set("#wipeB", { backgroundColor: color }, at - 0.5);
  tl.fromTo("#wipeA", { scaleX: 0, transformOrigin: origin }, { scaleX: 1, duration: 0.46, ease: "power4.inOut" }, at - 0.46);
  tl.fromTo("#wipeB", { scaleX: 0, transformOrigin: origin }, { scaleX: 1, duration: 0.46, ease: "power4.inOut" }, at - 0.36);
  FAST.push([at - 0.5, at + 0.16]);
  bg(color, at + 0.1);
  tl.set(["#wipeA", "#wipeB"], { scaleX: 0 }, at + 0.1);
  cue("whoosh", at - 0.46, { dir: fromRight ? -1 : 1 });
}
function rectOf(el) {
  const r = el.getBoundingClientRect();
  const s = stage.getBoundingClientRect();
  const x = r.left - s.left;
  const y = r.top - s.top;
  return { x, y, w: r.width, h: r.height, cx: x + r.width / 2, cy: y + r.height / 2 };
}

/* ------------------------------------------------------------------ assets */

async function loadIcons() {
  const els = $$("[data-icon]");
  const names = [...new Set(els.map((e) => e.dataset.icon))];
  const svgs = Object.fromEntries(
    await Promise.all(
      names.map(async (n) => {
        const txt = await (await fetch(`/node_modules/lucide-static/icons/${n}.svg`)).text();
        return [n, txt.replace(/<!--[\s\S]*?-->/g, "").trim()];
      }),
    ),
  );
  for (const el of els) {
    el.innerHTML = svgs[el.dataset.icon];
    const svg = el.querySelector("svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.querySelectorAll("path,circle,rect,line,polyline,polygon,ellipse").forEach((p) => p.setAttribute("pathLength", "1"));
  }
}

/* ------------------------------------------------------------------ 7-Segment-Anzeige (Zapfsäule) */

const SEG_MAP = { 0: "abcdef", 1: "bc", 2: "abged", 3: "abgcd", 4: "fgbc", 5: "afgcd", 6: "afgedc", 7: "abc", 8: "abcdefg", 9: "abcdfg", " ": "" };
function buildSeg(svg, cells, dpAfter, h) {
  const NS = "http://www.w3.org/2000/svg";
  const w = h * 0.54;
  const t = h * 0.11;
  const g = h * 0.016;
  const adv = w + h * 0.2;
  const skew = 0.1;
  const hs = (x0, x1, y) =>
    `${x0},${y} ${x0 + t / 2},${y - t / 2} ${x1 - t / 2},${y - t / 2} ${x1},${y} ${x1 - t / 2},${y + t / 2} ${x0 + t / 2},${y + t / 2}`;
  const vs = (x, y0, y1) =>
    `${x},${y0} ${x + t / 2},${y0 + t / 2} ${x + t / 2},${y1 - t / 2} ${x},${y1} ${x - t / 2},${y1 - t / 2} ${x - t / 2},${y0 + t / 2}`;
  const P = {
    a: hs(t / 2 + g, w - t / 2 - g, t / 2),
    g: hs(t / 2 + g, w - t / 2 - g, h / 2),
    d: hs(t / 2 + g, w - t / 2 - g, h - t / 2),
    f: vs(t / 2, t / 2 + g, h / 2 - g),
    b: vs(w - t / 2, t / 2 + g, h / 2 - g),
    e: vs(t / 2, h / 2 + g, h - t / 2 - g),
    c: vs(w - t / 2, h / 2 + g, h - t / 2 - g),
  };
  const total = cells * adv;
  svg.setAttribute("viewBox", `0 0 ${total} ${h}`);
  svg.setAttribute("width", total);
  svg.setAttribute("height", h);
  const digits = [];
  for (let i = 0; i < cells; i++) {
    const grp = document.createElementNS(NS, "g");
    grp.setAttribute("transform", `translate(${i * adv + skew * h} 0) skewX(${(-Math.atan(skew) * 180) / Math.PI})`);
    const segs = {};
    for (const k of "abcdefg") {
      const p = document.createElementNS(NS, "polygon");
      p.setAttribute("points", P[k]);
      p.setAttribute("class", "s");
      grp.appendChild(p);
      segs[k] = p;
    }
    svg.appendChild(grp);
    digits.push(segs);
  }
  const dp = document.createElementNS(NS, "circle");
  dp.setAttribute("cx", dpAfter * adv - (adv - w) / 2 + skew * t);
  dp.setAttribute("cy", h - t / 2);
  dp.setAttribute("r", t * 0.58);
  dp.setAttribute("class", "s on");
  svg.appendChild(dp);
  return { svg, digits, last: "" };
}
function setSeg(seg, str) {
  if (seg.last === str) return;
  seg.last = str;
  [...str].forEach((ch, i) => {
    const on = SEG_MAP[ch] ?? "";
    for (const k of "abcdefg") seg.digits[i][k].classList.toggle("on", on.includes(k));
  });
}
const pumpStr = (v) => String(Math.round(v * 100)).padStart(3, "0").padStart(6, " ");

let segEuro;
let segLiter;
const PUMP = { start: 0.45, stop: 3.55, liters: 742.38, price: 1.729 };
function drawPump(t) {
  if (t > T.s2 + 0.1) return;
  const u = prog(t, PUMP.start, PUMP.stop);
  const f = u < 0.1 ? 5 * u * u : u - 0.05; // anlaufen, dann konstanter Durchfluss
  const liters = (PUMP.liters * f) / 0.95;
  setSeg(segLiter, pumpStr(liters));
  setSeg(segEuro, pumpStr(liters * PUMP.price));
  // LCD schaltet sich flackernd ein
  let o = 1;
  if (t < 0.28) o = 0;
  else if (t < 0.56) o = [1, 0, 1, 1, 0, 1, 0, 1][Math.floor(t * 30) % 8];
  segEuro.svg.style.opacity = o;
  segLiter.svg.style.opacity = o;
}

/* ------------------------------------------------------------------ Karte Europa */

let mctx;
let ROUTES = [];
function mapCam(lt) {
  const p = E.inOutSine(clamp(lt / 5.4));
  const s = 1 + 0.09 * p;
  const [x0, y0, x1, y1] = MAP.deBounds;
  return { s, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}
function buildRoutes() {
  ROUTES = MAP.routes.map((names, ri) => {
    const pts = names.map((n) => MAP.hubs[n]);
    // Zwischenpunkte leicht seitlich versetzen, damit die Linien als Bögen laufen.
    const ctrl = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      const len = Math.hypot(bx - ax, by - ay);
      const sgn = (i + ri) % 2 ? 1 : -1;
      ctrl.push([(ax + bx) / 2 + (-(by - ay) / len) * len * 0.12 * sgn, (ay + by) / 2 + ((bx - ax) / len) * len * 0.12 * sgn]);
      ctrl.push(pts[i]);
    }
    // Catmull-Rom abtasten
    const out = [];
    for (let i = 0; i < ctrl.length - 1; i++) {
      const p0 = ctrl[Math.max(0, i - 1)];
      const p1 = ctrl[i];
      const p2 = ctrl[i + 1];
      const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
      for (let k = 0; k < 16; k++) {
        const s = k / 16;
        const s2 = s * s;
        const s3 = s2 * s;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * s + (2 * a - 5 * b + 4 * c - d) * s2 + (-a + 3 * b - 3 * c + d) * s3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(ctrl[ctrl.length - 1]);
    const cum = [0];
    for (let i = 1; i < out.length; i++) cum.push(cum[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
    return { pts: out, cum, len: cum[cum.length - 1], start: 1.25 + ri * 0.28 };
  });
}
function pointAt(r, d) {
  let i = 1;
  while (i < r.cum.length - 1 && r.cum[i] < d) i++;
  const a = r.pts[i - 1];
  const b = r.pts[i];
  const k = clamp((d - r.cum[i - 1]) / (r.cum[i] - r.cum[i - 1] || 1));
  return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
}
function drawMap(t) {
  const lt = t - T.s4;
  if (lt < -0.2 || lt > 5.4) return;
  const { s, cx, cy } = mapCam(lt);
  const ctx = mctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.setTransform(s, 0, 0, s, cx - s * cx, cy - s * cy);

  // Land als Punktraster, Welle ab Flensburg
  const buckets = new Map();
  for (const [x, y, d, de] of MAP.dots) {
    const p = clamp((lt - (0.02 + d / 1700)) / 0.45);
    if (p <= 0) continue;
    const a = (Math.round(p * 8) / 8) * (de ? 1.75 : 1);
    if (!buckets.has(a)) buckets.set(a, []);
    buckets.get(a).push(x, y);
  }
  ctx.fillStyle = "#fff";
  for (const [a, pts] of buckets) {
    ctx.globalAlpha = 0.25 * a;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i += 2) {
      ctx.moveTo(pts[i] + 2, pts[i + 1]);
      ctx.arc(pts[i], pts[i + 1], 2, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  // Routen
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const r of ROUTES) {
    const p = E.inOutCubic(clamp((lt - r.start) / 1.15));
    if (p <= 0) continue;
    const dEnd = r.len * p;
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = RED;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(r.pts[0][0], r.pts[0][1]);
    for (let i = 1; i < r.pts.length && r.cum[i] <= dEnd; i++) ctx.lineTo(r.pts[i][0], r.pts[i][1]);
    const head = pointAt(r, dEnd);
    ctx.lineTo(head[0], head[1]);
    ctx.stroke();
    // Lichtpunkt: zeichnet die Linie, fährt danach weiter die Route ab
    const travel = p < 1 ? dEnd : ((lt - r.start - 1.15) * 260) % r.len;
    const [hx, hy] = pointAt(r, travel);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(hx, hy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(hx, hy, 3.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stationen
  for (const [x, y, d, j] of MAP.stations) {
    const q = lt - (0.3 + (d / 1700) * 1.9 + j * 0.25);
    if (q <= 0) continue;
    const p = clamp(q / 0.45);
    const sc = p < 1 ? Math.max(0, E.outBack(p, 2.6)) : 1;
    ctx.fillStyle = RED;
    ctx.globalAlpha = 0.17 * clamp(q / 0.3);
    ctx.beginPath();
    ctx.arc(x, y, 8 * sc, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(x, y, 3 * sc, 0, Math.PI * 2);
    ctx.fill();
    if (j < 0.45 && q < 1) {
      ctx.globalAlpha = 0.55 * (1 - q);
      ctx.strokeStyle = RED;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(x, y, 3 + 22 * E.outCubic(q), 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ Übergänge (reine Zeitfunktionen) */

const EXPANDS = [];
function drawExpand(t) {
  const el = $("#expand");
  const e = EXPANDS.find((x) => t >= x.t0 && t < x.t3);
  if (!e) {
    el.style.visibility = "hidden";
    return;
  }
  const r = e.rect(t);
  el.style.visibility = "visible";
  el.style.left = `${r.x}px`;
  el.style.top = `${r.y}px`;
  el.style.width = `${r.w}px`;
  el.style.height = `${r.h}px`;
  el.style.borderRadius = `${r.radius}px`;
}

const IRIS = { a: T.s5 - 0.45, b: T.s5, c: T.s5 + 0.62 };
function drawIris(t) {
  const el = $("#iris");
  if (t < IRIS.a || t >= IRIS.c) {
    el.style.visibility = "hidden";
    return;
  }
  const cam = mapCam(IRIS.a - T.s4);
  const [hx, hy] = MAP.hubs.hamburg;
  const cx = cam.cx + (hx - cam.cx) * cam.s;
  const cy = cam.cy + (hy - cam.cy) * cam.s;
  let D;
  let border;
  if (t < IRIS.b) {
    D = lerp(6, 3400, E.inOutCubic(prog(t, IRIS.a, IRIS.b)));
    border = D / 2;
  } else {
    const p = E.outCubic(prog(t, IRIS.b, IRIS.c));
    D = 3400 + 500 * p;
    border = (D / 2) * (1 - p);
  }
  el.style.visibility = "visible";
  el.style.left = `${cx - D / 2}px`;
  el.style.top = `${cy - D / 2}px`;
  el.style.width = `${D}px`;
  el.style.height = `${D}px`;
  el.style.borderWidth = `${border}px`;
}

/* ------------------------------------------------------------------ Zähler & Tippen */

const lastText = new Map();
function setText(el, txt) {
  if (lastText.get(el) === txt) return;
  lastText.set(el, txt);
  el.textContent = txt;
}
function counter(el, t, a, b, target) {
  setText(el, fmtDE(target * E.outCubic(prog(t, a, b))));
}
let FIELDS = [];
function drawCounters(t) {
  counter($("#calcNum"), t, T.s3 + 2.3, T.s3 + 3.7, 10000);
  counter($("#netNum"), t, T.s4 + 0.3, T.s4 + 2.6, 2200);
  counter($("#kpiLiter"), t, T.s6 + 0.8, T.s6 + 2.1, 18420);
  counter($("#kpiTx"), t, T.s6 + 0.8, T.s6 + 2.1, 312);
  const locked = t >= T.s6 + 2.97;
  setText($("#kpiCards"), locked ? "23" : "24");
  const st = $("#cState");
  setText(st, locked ? "gesperrt" : "aktiv");
  st.classList.toggle("lock", locked);
  // Kontaktformular tippt sich selbst aus
  for (const f of FIELDS) {
    const n = Math.floor(prog(t, f.ts, f.te) * f.text.length + 1e-6);
    setText(f.val, f.text.slice(0, n));
    const active = t >= f.ts - 0.06 && t < f.te + 0.16;
    f.input.classList.toggle("active", active);
    f.caret.style.opacity = active ? 1 : 0;
  }
}

/* ------------------------------------------------------------------ Atmosphäre */

let actx;
const AMB = (() => {
  const r = mulberry32(7);
  return Array.from({ length: 44 }, (_, i) => ({
    y: r() * H,
    len: 140 + r() * 560,
    speed: 420 + r() * 1700,
    w: r() < 0.22 ? 2 : 1,
    a: 0.035 + r() * 0.08,
    red: i % 11 === 3,
    off: r() * 4000,
  }));
})();
const AMB_KEYS = [
  [0, 0], [0.4, 0.7], [3.95, 0.7], [4.1, 1], [7.95, 1], [8.0, 0], [19.0, 0], [19.3, 0.35], [24.95, 0.35],
  [25.0, 0], [30.0, 0], [30.2, 0.45], [42.95, 0.45], [43.2, 0.85], [99, 0.85],
];
function ambientLevel(t) {
  for (let i = 1; i < AMB_KEYS.length; i++) {
    const [t1, v1] = AMB_KEYS[i];
    const [t0, v0] = AMB_KEYS[i - 1];
    if (t <= t1) return lerp(v0, v1, prog(t, t0, t1));
  }
  return 0;
}
function drawAmbient(t) {
  actx.clearRect(0, 0, W, H);
  const A = ambientLevel(t);
  if (A < 0.01) return;
  for (const l of AMB) {
    const span = W + l.len * 2;
    const x = W + l.len - ((l.off + l.speed * t) % span);
    const col = l.red ? "227,30,36" : "255,255,255";
    const al = (l.red ? 0.45 : l.a) * A;
    const g = actx.createLinearGradient(x, 0, x + l.len, 0);
    g.addColorStop(0, `rgba(${col},0)`);
    g.addColorStop(0.08, `rgba(${col},${al})`);
    g.addColorStop(1, `rgba(${col},0)`);
    actx.fillStyle = g;
    actx.fillRect(x, l.y, l.len, l.w);
  }
}

let gctx;
let GRAIN = [];
let lastGrain = -1;
function drawGrain(t) {
  // Korn wechselt pro Ausgabe-Frame (30 fps), damit Subframes dasselbe Korn teilen
  const f = Math.floor(t * 30 + 1e-6) % GRAIN.length;
  if (f === lastGrain) return;
  gctx.putImageData(GRAIN[f], 0, 0);
  lastGrain = f;
}

/* ------------------------------------------------------------------ Szenen */

function sceneHook() {
  const s = T.s1;
  show("#s1", s, T.s2);
  tl.fromTo("#pump", { autoAlpha: 0, x: 70, scale: 0.97 }, { autoAlpha: 1, x: 0, scale: 1, duration: 1.3, ease: "expo.out" }, s + 0.1);
  tl.to("#pump", { y: -12, duration: 3.2, ease: "sine.inOut" }, s + 0.7);
  reveal("#hookA .ln", s + 0.3, 0.09, 1.0);
  conceal("#hookA .ln", s + 1.72, 0.05);
  reveal("#hookB .ln", s + 2.0, 0.09, 1.0);
  tl.fromTo("#centLine", { scaleX: 0 }, { scaleX: 1, duration: 0.55, ease: "power3.inOut" }, s + 2.5);
  cue("lcd", s + 0.28);
  cue("pumpRun", PUMP.start, { dur: PUMP.stop - PUMP.start });
  cue("pumpStop", PUMP.stop);
  cue("swish", s + 0.3);
  cue("swish", s + 2.0);
  cue("zip", s + 2.5);

  // Übergang: Unterstreichung wird zur roten Fläche
  const u = M.centLine;
  EXPANDS.push({
    t0: 3.4,
    t3: 4.5,
    rect(t) {
      const p1 = E.inOutCubic(prog(t, 3.4, 3.68));
      const p2 = E.inOutQuart(prog(t, 3.6, 3.98));
      const p3 = E.inOutQuart(prog(t, 4.0, 4.5));
      return {
        x: lerp(u.x, 0, p1) + W * p3,
        y: lerp(u.y, 0, p2),
        w: lerp(u.w, W, p1),
        h: lerp(u.h, H, p2),
        radius: 0,
      };
    },
  });
  cue("riser", 3.0, { dur: 1.0 });
  cue("whoosh", 3.45);
  cue("impact", T.s2);
}

function sceneReveal() {
  const s = T.s2;
  show("#s2", s, T.s3);
  tl.fromTo("#s2glow", { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 2.2, ease: "power2.out" }, s);
  tl.fromTo(
    "#card",
    { rotationY: -72, rotationX: 30, rotationZ: -14, x: -340, y: 260, z: -300 },
    { rotationY: -17, rotationX: 9, rotationZ: -4, x: 0, y: 0, z: 0, duration: 1.7, ease: "expo.out" },
    s + 0.06,
  );
  tl.to("#card", { rotationY: -9, rotationX: 5, y: -16, duration: 2.2, ease: "sine.inOut" }, s + 1.76);
  tl.fromTo("#cardFloor", { autoAlpha: 0, scaleX: 0.4 }, { autoAlpha: 1, scaleX: 1, duration: 1.5, ease: "expo.out" }, s + 0.25);
  tl.fromTo("#cardSheen", { xPercent: -150 }, { xPercent: 420, duration: 1.2, ease: "power2.inOut" }, s + 0.95);
  reveal("#s2 .brandline .ln", s + 0.42);
  reveal("#s2 .h1 .ln", s + 0.5, 0.1, 1.05);
  reveal("#s2 .sub .ln", s + 0.95);
  conceal("#s2 .s2-text .ln", T.s3 - 0.6, 0.04);
  tl.to("#card", { x: -140, rotationY: -45, autoAlpha: 0, duration: 0.5, ease: "power3.in" }, T.s3 - 0.55);
  tl.to("#cardFloor", { autoAlpha: 0, duration: 0.4 }, T.s3 - 0.5);
  cue("cardIn", s + 0.06);
  cue("shimmer", s + 0.95);
  wipe(T.s3, "#F3F3F0");
}

function sceneSavings() {
  const s = T.s3;
  show("#s3", s, T.s4);
  reveal("#s3 .kicker .ln", s + 0.15);
  reveal("#s3 .s3-pre .ln", s + 0.22);
  tl.fromTo("#rollStrip", { yPercent: 20 }, { yPercent: -80, duration: 1.3, ease: "power4.out" }, s + 0.3);
  reveal("#s3 .ct .ln", s + 0.68, 0, 0.9);
  reveal("#s3 .s3-post .ln", s + 0.82);
  tl.fromTo("#calc", { autoAlpha: 0, x: 150 }, { autoAlpha: 1, x: 0, duration: 1.0, ease: "expo.out" }, s + 1.3);
  tl.fromTo(["#calcR1", "#calcR2"], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "expo.out", stagger: 0.18 }, s + 1.6);
  tl.fromTo("#calcLine", { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power3.inOut" }, s + 2.0);
  tl.fromTo(["#calcTL", "#calcTotal"], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "expo.out", stagger: 0.1 }, s + 2.15);
  tl.fromTo("#calcNote", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, s + 2.9);
  tl.to("#calcTotal", { scale: 1.06, duration: 0.16, ease: "power2.out", yoyo: true, repeat: 1 }, s + 3.7);
  drawIcon("#calc .calc-head span", s + 1.55, 0.6);
  conceal("#s3 .s3-left .ln", T.s4 - 0.6, 0.03);
  tl.to("#calc", { x: -60, autoAlpha: 0, duration: 0.45, ease: "power3.in" }, T.s4 - 0.55);
  cue("roll", s + 0.3, { dur: 1.0 });
  cue("land", s + 0.95);
  cue("swish", s + 1.3);
  cue("count", s + 2.3, { dur: 1.4 });
  cue("ding", s + 3.7);
  wipe(T.s4, "#0B0B0C", true);
}

function sceneNetwork() {
  const s = T.s4;
  show("#s4", s, T.s5);
  reveal("#s4 .kicker .ln", s + 0.2);
  reveal("#netNum", s + 0.25, 0, 1.0);
  reveal("#s4 .h1 .ln", s + 0.4);
  reveal("#s4 .sub .ln", s + 0.6);
  conceal("#s4 .s4-text .ln", T.s5 - 0.62, 0.03);
  cue("sparkle", s + 0.3, { dur: 2.3 });
  cue("count", s + 0.3, { dur: 2.3 });
  cue("route", s + 1.25, { dur: 1.9 });
  cue("whoosh", IRIS.a);
  cue("impactSoft", T.s5);
  bg("#0B0B0C", T.s5);
}

function sceneSecurity() {
  const s = T.s5;
  show("#s5", s, T.s6);
  tl.fromTo("#s5 .rings", { scale: 0.5, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.6, ease: "expo.out" }, s + 0.15);
  tl.to("#s5 .rings", { scale: 1.12, duration: 4.4, ease: "none" }, s + 1.75);
  tl.fromTo("#shieldPath", { strokeDasharray: "1 2", strokeDashoffset: 1.01 }, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut" }, s + 0.3);
  tl.fromTo("#shieldFill", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, s + 1.0);
  tl.fromTo("#dcard", { autoAlpha: 0, y: 260, rotation: -16, scale: 0.9 }, { autoAlpha: 1, y: 0, rotation: -5, scale: 1, duration: 1.0, ease: "expo.out" }, s + 0.8);
  tl.fromTo("#dcardScan", { top: "0%", opacity: 0 }, { top: "100%", opacity: 1, duration: 0.7, ease: "power1.inOut" }, s + 1.75);
  tl.to("#dcardScan", { opacity: 0, duration: 0.15 }, s + 2.45);
  tl.fromTo("#secBadge", { scale: 0, rotation: -40 }, { scale: 1, rotation: 0, duration: 0.7, ease: "back.out(2.2)" }, s + 2.5);
  drawIcon("#secBadge", s + 2.62, 0.4);
  reveal("#s5 .kicker .ln", s + 0.2);
  reveal("#s5 .h1 .ln", s + 0.3, 0.1, 1.0);
  $$("#s5 .checks li").forEach((li, i) => {
    const at = s + 1.3 + i * 0.42;
    tl.fromTo(li.querySelector(".ck"), { scale: 0 }, { scale: 1, duration: 0.5, ease: "back.out(2.5)" }, at);
    drawIcon(li.querySelector(".ck"), at + 0.1, 0.35);
    reveal(li.querySelectorAll(".ln"), at + 0.05, 0, 0.8);
    cue("tick", at);
  });
  conceal("#s5 .s5-text .ln", T.s6 - 0.6, 0.03);
  tl.to("#s5 .sec-visual", { autoAlpha: 0, scale: 0.94, duration: 0.45, ease: "power3.in" }, T.s6 - 0.55);
  cue("draw", s + 0.3);
  cue("swish", s + 0.8);
  cue("scan", s + 1.75, { dur: 0.7 });
  cue("confirm", s + 2.5);
  wipe(T.s6, "#F3F3F0");
}

function sceneControl() {
  const s = T.s6;
  show("#s6", s, T.s7);
  reveal("#s6 .kicker .ln", s + 0.2);
  reveal("#s6 .h1 .ln", s + 0.28, 0.1, 1.0);
  reveal("#s6 .sub .ln", s + 0.45, 0.07);
  tl.fromTo("#portal", { autoAlpha: 0, y: 110, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.1, ease: "expo.out" }, s + 0.3);
  tl.fromTo("#s6 .kpi", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "expo.out", stagger: 0.08 }, s + 0.75);
  tl.fromTo("#s6 .tx-row", { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: "expo.out", stagger: 0.1 }, s + 0.95);
  tl.fromTo("#s6 .c-row", { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: "expo.out", stagger: 0.1 }, s + 1.1);
  const c = M.toggle3;
  tl.set("#cursor1", { visibility: "visible" }, s + 1.9);
  tl.fromTo("#cursor1", { x: 1720, y: 1030, autoAlpha: 0 }, { x: c.cx - 7, y: c.cy - 4, autoAlpha: 1, duration: 0.95, ease: "power3.inOut" }, s + 1.9);
  tl.to("#cursor1", { scale: 0.86, duration: 0.08, yoyo: true, repeat: 1, transformOrigin: "7px 4px" }, s + 2.9);
  tl.fromTo("#ring1", { x: c.cx, y: c.cy, scale: 0.3, opacity: 0.9 }, { scale: 1.7, opacity: 0, duration: 0.55, ease: "power2.out", immediateRender: false }, s + 2.92);
  tl.to("#toggle3", { backgroundColor: RED, duration: 0.2 }, s + 2.95);
  tl.to("#toggle3 b", { left: 4, duration: 0.25, ease: "power3.inOut" }, s + 2.95);
  tl.to("#cursor1", { x: "+=70", y: "+=110", autoAlpha: 0, duration: 0.6, ease: "power2.in" }, s + 3.7);
  conceal("#s6 .s6-text .ln", T.s7 - 0.6, 0.03);
  tl.to("#portal", { y: 50, autoAlpha: 0, duration: 0.45, ease: "power3.in" }, T.s7 - 0.55);
  cue("swish", s + 0.3);
  cue("count", s + 0.8, { dur: 1.3, soft: true });
  cue("click", s + 2.92);
  cue("toggle", s + 2.97);
  wipe(T.s7, "#0B0B0C", true);
}

function sceneServices() {
  const s = T.s7;
  show("#s7", s, T.s8);
  reveal("#s7 .kicker .ln", s + 0.2);
  reveal("#s7 .h1 .ln", s + 0.28, 0, 1.0);
  $$("#s7 .tile").forEach((tile, i) => {
    const at = s + 0.5 + i * 0.13;
    tl.fromTo(tile, { autoAlpha: 0, y: 70, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.95, ease: "expo.out" }, at);
    drawIcon(tile.querySelector(".t-ic"), at + 0.15, 0.8);
    tl.fromTo(tile, { "--accent": 0 }, { "--accent": 1, duration: 0.7, ease: "power3.inOut" }, at + 0.35);
    cue("pop", at, { i });
  });
  conceal("#s7 .s7-head .ln", T.s8 - 0.6, 0.03);
  tl.to("#s7 .tile", { autoAlpha: 0, y: -30, duration: 0.4, ease: "power3.in", stagger: 0.03 }, T.s8 - 0.6);
  wipe(T.s8, "#0B0B0C");
}

function sceneCTA() {
  const s = T.s8;
  show("#s8", s, T.s9);
  reveal("#question .ln", s + 0.15, 0.1, 1.0);
  tl.fromTo("#question", { scale: 1 }, { scale: 1.05, duration: 1.7, ease: "none" }, s + 0.15);
  conceal("#question .ln", s + 1.45, 0.05);
  reveal("#s8 .kicker .ln", s + 1.75);
  reveal("#s8 .s8-text .h1 .ln", s + 1.82, 0.1, 1.0);
  $$("#s8 .checks li").forEach((li, i) => {
    const at = s + 2.4 + i * 0.32;
    tl.fromTo(li.querySelector(".ck"), { scale: 0 }, { scale: 1, duration: 0.5, ease: "back.out(2.5)" }, at);
    drawIcon(li.querySelector(".ck"), at + 0.1, 0.35);
    reveal(li.querySelectorAll(".ln"), at + 0.05, 0, 0.8);
  });
  tl.fromTo("#form", { autoAlpha: 0, x: 170 }, { autoAlpha: 1, x: 0, duration: 1.1, ease: "expo.out" }, s + 1.72);

  // Felder füllen sich nacheinander
  const plan = [
    [2.3, 0.75],
    [3.15, 0.6],
    [3.85, 0.85],
    [4.82, 0.2],
  ];
  FIELDS = $$("#form .field").map((f, i) => {
    const text = f.dataset.type;
    const ts = s + plan[i][0];
    const te = ts + plan[i][1];
    for (let k = 0; k < text.length; k++) cue("key", ts + (k / text.length) * (te - ts));
    return { text, ts, te, val: $(".val", f), input: $(".input", f), caret: $(".caret", f) };
  });

  const b = M.sendBtn;
  gsap.set("#sendBtn .btn-b", { yPercent: 100 });
  tl.set("#cursor2", { visibility: "visible" }, s + 5.0);
  tl.fromTo("#cursor2", { x: 1840, y: 1060, autoAlpha: 0 }, { x: b.cx + 210, y: b.cy, autoAlpha: 1, duration: 0.62, ease: "power3.out" }, s + 5.0);
  tl.to("#cursor2", { scale: 0.86, duration: 0.08, yoyo: true, repeat: 1, transformOrigin: "7px 4px" }, s + 5.62);
  tl.fromTo("#ring2", { x: b.cx + 217, y: b.cy + 4, scale: 0.3, opacity: 0.9 }, { scale: 2, opacity: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, s + 5.64);
  tl.to("#sendBtn", { scale: 0.97, duration: 0.08, yoyo: true, repeat: 1 }, s + 5.64);
  tl.to("#sendBtn .btn-a", { yPercent: -100, duration: 0.45, ease: "expo.inOut" }, s + 5.72);
  tl.to("#sendBtn .btn-b", { yPercent: 0, duration: 0.45, ease: "expo.inOut" }, s + 5.72);
  drawIcon("#sendBtn .btn-b b", s + 5.95, 0.4);
  tl.to("#cursor2", { autoAlpha: 0, x: "+=50", y: "+=80", duration: 0.5, ease: "power2.in" }, s + 6.25);
  // Alles tritt zurück, nur der rote Button bleibt stehen und zieht dann auf
  conceal("#s8 .s8-text .ln", s + 6.85, 0.03);
  tl.to("#s8 .checks .ck", { scale: 0, duration: 0.3, ease: "power3.in", stagger: 0.04 }, s + 6.9);
  tl.to("#form .field, #form .form-h, #form .form-sub", { autoAlpha: 0, y: -10, duration: 0.3, stagger: 0.03, ease: "power2.in" }, s + 6.85);
  tl.to("#form", { backgroundColor: "rgba(255,255,255,0)", boxShadow: "0 0 0 0 rgba(0,0,0,0)", duration: 0.35, ease: "power2.inOut" }, s + 7.05);
  tl.to("#sendBtn .btn-b", { autoAlpha: 0, duration: 0.15 }, s + 7.32);
  cue("riser", s, { dur: 1.5, soft: true });
  cue("swish", s + 1.72);
  cue("click", s + 5.62);
  cue("success", s + 5.75);

  // Übergang: Button wird zur Fläche, die Fläche zur roten Linie der Endcard
  const eb = M.endBar;
  const t0 = s + 7.45;
  EXPANDS.push({
    t0,
    t3: T.s9 + 0.95,
    rect(t) {
      const p1 = E.inOutQuart(prog(t, t0, t0 + 0.5));
      const p2 = E.inOutQuart(prog(t, T.s9, T.s9 + 0.5));
      const p3 = E.inOutQuart(prog(t, T.s9 + 0.45, T.s9 + 0.95));
      let x = lerp(b.x, 0, p1);
      let y = lerp(b.y, 0, p1);
      let w = lerp(b.w, W, p1);
      let h = lerp(b.h, H, p1);
      y = lerp(y, eb.y, p2);
      h = lerp(h, eb.h, p2);
      x = lerp(x, eb.x, p3);
      w = lerp(w, eb.w, p3);
      return { x, y, w, h, radius: lerp(16, 0, p1) };
    },
  });
  cue("whooshUp", t0);
  cue("impact", T.s9);
}

function sceneEnd() {
  const s = T.s9;
  show("#s9", s, T.end + 10);
  const handoff = s + 0.95;
  tl.set("#endBar", { visibility: "visible" }, handoff);
  tl.fromTo("#endGlow", { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 2.4, ease: "power2.out" }, s + 0.3);
  reveal("#wordmark .ln", s + 0.55, 0, 1.15);
  reveal("#s9 .end-brand .ln", s + 0.8);
  tl.fromTo("#s9 .end-tag .ln", { yPercent: -120 }, { yPercent: 0, duration: 0.95, ease: "expo.out" }, handoff + 0.02);
  tl.fromTo("#cta", { autoAlpha: 0, scale: 0.82, y: 24 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.85, ease: "back.out(1.8)" }, handoff + 0.35);
  drawIcon("#cta b", handoff + 0.6, 0.45);
  tl.fromTo("#endNote", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "expo.out" }, handoff + 0.75);
  tl.fromTo("#ctaShine", { xPercent: -260 }, { xPercent: 520, duration: 1.0, ease: "power2.inOut" }, s + 2.4);
  tl.fromTo("#ctaShine", { xPercent: -260 }, { xPercent: 520, duration: 1.0, ease: "power2.inOut", immediateRender: false }, s + 4.0);
  tl.to("#cta b", { x: 8, duration: 0.32, ease: "power2.inOut", yoyo: true, repeat: 3 }, s + 2.6);
  cue("pop", handoff + 0.35, { i: 6 });
  cue("shine", s + 2.4);
  cue("shine", s + 4.0);
  // Länge der Timeline exakt auf T.end setzen
  tl.set({}, {}, T.end);
}

/* ------------------------------------------------------------------ init */

function measure() {
  const u = $("#centLine");
  u.style.transform = "none";
  M.centLine = rectOf(u);
  u.style.transform = "";
  M.toggle3 = rectOf($("#toggle3"));
  M.sendBtn = rectOf($("#sendBtn"));
  M.endBar = rectOf($("#endBar"));
}

function seek(t) {
  tl.seek(t, false);
  drawPump(t);
  drawCounters(t);
  drawMap(t);
  drawExpand(t);
  drawIris(t);
  drawAmbient(t);
  drawGrain(t);
}

async function init() {
  await Promise.all([
    document.fonts.load('800 100px "Barlow"'),
    document.fonts.load('700 100px "Barlow"'),
    document.fonts.load('600 100px "Barlow"'),
    document.fonts.load('500 100px "Barlow"'),
    document.fonts.load('800 100px "Barlow Condensed"'),
    document.fonts.load('700 100px "Barlow Condensed"'),
    document.fonts.load('500 100px "Barlow Condensed"'),
    loadIcons(),
    fetch("data/europe-dots.json").then((r) => r.json()).then((d) => (MAP = d)),
  ]);
  await document.fonts.ready;

  segEuro = buildSeg($("#segEuro"), 6, 4, 128);
  segLiter = buildSeg($("#segLiter"), 6, 4, 96);
  mctx = $("#map").getContext("2d");
  actx = $("#ambient").getContext("2d");
  gctx = $("#grain").getContext("2d");
  const rnd = mulberry32(1234);
  GRAIN = Array.from({ length: 6 }, () => {
    const img = gctx.createImageData(960, 540);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (rnd() * 255) | 0;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    return img;
  });
  buildRoutes();
  measure();

  sceneHook();
  sceneReveal();
  sceneSavings();
  sceneNetwork();
  sceneSecurity();
  sceneControl();
  sceneServices();
  sceneCTA();
  sceneEnd();

  cues.sort((a, b) => a.t - b.t);
  window.__T = T;
  window.__cues = cues;
  window.__fast = FAST;
  window.__duration = T.end;
  window.__seek = seek;
  seek(Number(params.get("t") || 0));
  window.__ready = true;

  if (!RENDER) startPreview();
}

function startPreview() {
  document.body.classList.add("preview");
  const fit = () => {
    const sc = Math.min(innerWidth / W, innerHeight / H);
    stage.style.transform = `translate(${(innerWidth - W * sc) / 2}px, ${(innerHeight - H * sc) / 2}px) scale(${sc})`;
  };
  fit();
  addEventListener("resize", fit);
  let cur = Number(params.get("t") || 0);
  let playing = !params.has("t");
  let last = performance.now();
  addEventListener("keydown", (e) => {
    if (e.code === "Space") playing = !playing;
    if (e.code === "ArrowRight") cur = Math.min(T.end, cur + (e.shiftKey ? 1 : 1 / 30));
    if (e.code === "ArrowLeft") cur = Math.max(0, cur - (e.shiftKey ? 1 : 1 / 30));
    if (e.code === "Home") cur = 0;
  });
  const loop = (now) => {
    if (playing) cur += (now - last) / 1000;
    if (cur > T.end) cur = 0;
    last = now;
    seek(cur);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

init();

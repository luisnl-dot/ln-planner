/* global gsap */
// Gemeinsame Motion-Engine für alle Kompositionen (Website-Video und Reels).
// Deterministisch: seek(t) zeichnet exakt den Zustand zum Zeitpunkt t (Sekunden).
// GSAP steuert DOM-Bewegungen, Canvas/Zähler/Tippen sind reine Funktionen der Zeit.

export const RED = "#E31E24";
export const params = new URLSearchParams(location.search);
export const RENDER = params.has("render");

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const E = {
  outCubic: (x) => 1 - Math.pow(1 - x, 3),
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  inOutExpo: (x) =>
    x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2,
  outBack: (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
  inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  inOutQuart: (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2),
};
export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const fmtDE = (n, d = 0) =>
  n.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });

const DEFAULT_FONTS = [
  '800 100px "Barlow"',
  '700 100px "Barlow"',
  '600 100px "Barlow"',
  '500 100px "Barlow"',
  '800 100px "Barlow Condensed"',
  '700 100px "Barlow Condensed"',
  '500 100px "Barlow Condensed"',
];

export function createEngine({ width, height }) {
  const W = width;
  const H = height;
  const stage = $("#stage");
  const tl = gsap.timeline({ paused: true });
  // Sound-Cues: werden beim Aufbau der Timeline gesammelt und vom Audio-Skript gelesen.
  const cues = [];
  // Zeitfenster mit sehr schneller Bewegung: der Renderer nimmt dort mehr Subframes.
  const FAST = [];
  const EXPANDS = [];
  const cue = (type, t, extra = {}) => cues.push({ type, t: Math.round(t * 1000) / 1000, ...extra });

  /* -------------------------------------------------------------- Timeline-Helfer */

  function show(sel, from, to) {
    // Eine Szene ab t=0 ist schon im allerersten Frame sichtbar (wichtig für Reels).
    if (from <= 0) gsap.set(sel, { autoAlpha: 1 });
    else tl.set(sel, { autoAlpha: 1 }, from);
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
  // opts: true = von rechts; { vertical: true, fromTop } = senkrecht (Hochformat)
  function wipe(at, color, opts = {}) {
    const { fromRight = false, vertical = false, fromTop = false } = typeof opts === "boolean" ? { fromRight: opts } : opts;
    const axis = vertical ? "scaleY" : "scaleX";
    const origin = vertical ? (fromTop ? "center top" : "center bottom") : fromRight ? "right center" : "left center";
    tl.set("#wipeB", { backgroundColor: color }, at - 0.5);
    tl.fromTo("#wipeA", { [axis]: 0, transformOrigin: origin }, { [axis]: 1, duration: 0.46, ease: "power4.inOut" }, at - 0.46);
    tl.fromTo("#wipeB", { [axis]: 0, transformOrigin: origin }, { [axis]: 1, duration: 0.46, ease: "power4.inOut" }, at - 0.36);
    FAST.push([at - 0.5, at + 0.16]);
    bg(color, at + 0.1);
    tl.set(["#wipeA", "#wipeB"], { [axis]: 0 }, at + 0.1);
    cue("whoosh", at - 0.46, { dir: vertical ? 0 : fromRight ? -1 : 1 });
  }
  function rectOf(el) {
    const r = el.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const x = r.left - s.left;
    const y = r.top - s.top;
    return { x, y, w: r.width, h: r.height, cx: x + r.width / 2, cy: y + r.height / 2 };
  }

  /* -------------------------------------------------------------- Text & Zähler */

  const lastText = new Map();
  function setText(el, txt) {
    if (lastText.get(el) === txt) return;
    lastText.set(el, txt);
    el.textContent = txt;
  }
  function counter(el, t, a, b, target) {
    setText(el, fmtDE(target * E.outCubic(prog(t, a, b))));
  }

  /* -------------------------------------------------------------- Rote Fläche (Expand) */

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

  /* -------------------------------------------------------------- Assets */

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
  async function loadAssets({ fonts = DEFAULT_FONTS, extra = [] } = {}) {
    await Promise.all([...fonts.map((f) => document.fonts.load(f)), loadIcons(), ...$$("img").map((i) => i.decode()), ...extra]);
    await document.fonts.ready;
  }

  /* -------------------------------------------------------------- Körnung */

  let gctx;
  let grain = [];
  let lastGrain = -1;
  function initGrain({ canvas = $("#grain"), tiles = 6, seed = 1234 } = {}) {
    gctx = canvas.getContext("2d");
    const rnd = mulberry32(seed);
    grain = Array.from({ length: tiles }, () => {
      const img = gctx.createImageData(canvas.width, canvas.height);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = (rnd() * 255) | 0;
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      return img;
    });
  }
  function drawGrain(t) {
    // Korn wechselt pro Ausgabe-Frame (30 fps), damit Subframes dasselbe Korn teilen
    const f = Math.floor(t * 30 + 1e-6) % grain.length;
    if (f === lastGrain) return;
    gctx.putImageData(grain[f], 0, 0);
    lastGrain = f;
  }

  /* -------------------------------------------------------------- Lichtstreifen im Hintergrund */

  function createAmbient({ canvas = $("#ambient"), keys, count = 44, seed = 7 }) {
    const actx = canvas.getContext("2d");
    const r = mulberry32(seed);
    const lines = Array.from({ length: count }, (_, i) => ({
      y: r() * H,
      len: 140 + r() * 560,
      speed: 420 + r() * 1700,
      w: r() < 0.22 ? 2 : 1,
      a: 0.035 + r() * 0.08,
      red: i % 11 === 3,
      off: r() * 4000,
    }));
    const level = (t) => {
      for (let i = 1; i < keys.length; i++) {
        const [t1, v1] = keys[i];
        const [t0, v0] = keys[i - 1];
        if (t <= t1) return lerp(v0, v1, prog(t, t0, t1));
      }
      return 0;
    };
    return function drawAmbient(t) {
      actx.clearRect(0, 0, W, H);
      const A = level(t);
      if (A < 0.01) return;
      for (const l of lines) {
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
    };
  }

  /* -------------------------------------------------------------- Veröffentlichen & Vorschau */

  // Stellt die Schnittstelle für Renderer/Audio bereit und startet ohne ?render die Vorschau.
  function publish({ duration, seek, T = null, cover = null, music = null }) {
    tl.set({}, {}, duration);
    cues.sort((a, b) => a.t - b.t);
    window.__T = T;
    window.__cues = cues;
    window.__fast = FAST;
    window.__duration = duration;
    window.__size = { width: W, height: H };
    window.__cover = cover;
    window.__music = music;
    window.__seek = seek;
    seek(Number(params.get("t") || 0));
    window.__ready = true;
    if (!RENDER) startPreview(seek, duration);
  }
  function startPreview(seek, duration) {
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
      if (e.code === "ArrowRight") cur = Math.min(duration, cur + (e.shiftKey ? 1 : 1 / 30));
      if (e.code === "ArrowLeft") cur = Math.max(0, cur - (e.shiftKey ? 1 : 1 / 30));
      if (e.code === "Home") cur = 0;
    });
    const loop = (now) => {
      if (playing) cur += (now - last) / 1000;
      if (cur > duration) cur = 0;
      last = now;
      seek(cur);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  return {
    W, H, stage, tl, cues, FAST, EXPANDS, cue,
    show, reveal, conceal, bg, drawIcon, wipe, rectOf,
    setText, counter, drawExpand,
    loadAssets, initGrain, drawGrain, createAmbient, publish,
  };
}

/* ------------------------------------------------------------------ 7-Segment-Anzeige (Zapfsäule) */

const SEG_MAP = { 0: "abcdef", 1: "bc", 2: "abged", 3: "abgcd", 4: "fgbc", 5: "afgcd", 6: "afgedc", 7: "abc", 8: "abcdefg", 9: "abcdfg", " ": "" };
export function buildSeg(svg, cells, dpAfter, h) {
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
export function setSeg(seg, str) {
  if (seg.last === str) return;
  seg.last = str;
  [...str].forEach((ch, i) => {
    const on = SEG_MAP[ch] ?? "";
    for (const k of "abcdefg") seg.digits[i][k].classList.toggle("on", on.includes(k));
  });
}

/* ------------------------------------------------------------------ Europa als Punktraster */

// Zeichnet Land, Routen und Stationen aus src/data/europe-dots.json zum lokalen Zeitpunkt lt.
// Die Punkte sind Illustration (Netzdichte), keine echten Standorte.
export function createDotMap(MAP, { routes = true } = {}) {
  const ROUTES = !routes
    ? []
    : MAP.routes.map((names, ri) => {
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
  const pointAt = (r, d) => {
    let i = 1;
    while (i < r.cum.length - 1 && r.cum[i] < d) i++;
    const a = r.pts[i - 1];
    const b = r.pts[i];
    const k = clamp((d - r.cum[i - 1]) / (r.cum[i] - r.cum[i - 1] || 1));
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  };

  return function draw(ctx, lt, { dot = 2, station = 3, glow = 8, alpha = 1 } = {}) {
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
      ctx.globalAlpha = Math.min(1, 0.25 * a * alpha);
      ctx.beginPath();
      for (let i = 0; i < pts.length; i += 2) {
        ctx.moveTo(pts[i] + dot, pts[i + 1]);
        ctx.arc(pts[i], pts[i + 1], dot, 0, Math.PI * 2);
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
      ctx.arc(x, y, glow * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(x, y, station * sc, 0, Math.PI * 2);
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
  };
}

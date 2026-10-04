/* global gsap */
// Instagram Reel „5 Gründe“ (1080x1920, 22 s)
// Hook mit Originalkarte → 5 Gründe mit Fortschrittsbalken → Endcard „Link in Bio“.
import { $, $$, E, clamp, createDotMap } from "./engine.js";
import { createReel, cardIn, endCard } from "./reel-kit.js";

// Szenenplan in Sekunden (120 BPM): Hook, fünf Gründe à 3 s, Endcard
const REASON = 3;
const T = { hook: 0, r: [2.5, 5.5, 8.5, 11.5, 14.5], cta: 17.5, end: 22 };

// Musikplan für scripts/audio.py; jede neue Nummer bekommt einen höheren Glockenton.
const MUSIC = {
  lufs: -14,
  cycleStartBar: 0,
  groove: [[0, 17.5]],
  claps: [[2.5, 17.5]],
  openHats: [[11.5, 17.5]],
  lift: [[14.5, 17.5]],
  outro: [[17.5, 22]],
  end: 17.5,
  melody: [[2.5, 72], [5.5, 76], [8.5, 81], [11.5, 84], [14.5, 86]],
};

const AMB_KEYS = [[0, 0.7], [2.4, 0.7], [2.6, 0.4], [17.4, 0.4], [17.6, 0.8], [99, 0.8]];

const K = createReel();
const { tl, cue, FAST, show, reveal, conceal, wipe, drawIcon, rectOf, setText, counter } = K;
const M = {};
let MAP = null;
let mctx;
let drawDots;
let drawAmbient;

function hook() {
  show("#g0", T.hook, T.r[0]);
  // Erstes Bild: rote 5 und die Originalkarte stehen sofort
  tl.fromTo("#five", { scale: 1.2 }, { scale: 1, duration: 0.7, ease: "expo.out" }, 0);
  tl.fromTo("#g0 .glow", { autoAlpha: 0.4, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 1.2, ease: "power2.out" }, 0);
  cardIn(K, "#c0", 0, {
    dur: 1.4,
    from: { autoAlpha: 1, rotationY: -38, rotationX: 28, rotationZ: -8, x: 0, y: 160, z: -120 },
    to: { rotationY: -10, rotationX: 12, rotationZ: -3 },
    sheenAt: 1.0,
  });
  reveal("#g0 .kicker .ln", 0.08);
  reveal("#g0 .m-unit .ln", 0.2, 0, 0.8);
  reveal("#g0 .sub .ln", 0.6, 0, 0.8);
  tl.to("#five", { scale: 1.04, duration: 0.12, yoyo: true, repeat: 1 }, 1.0);
  wipe(T.r[0], "#0B0B0C", { vertical: true });
  FAST.push([0, 0.3]);
  cue("impact", 0);
  cue("swish", 0.08);
  cue("swish", 0.2);
  cue("swish", 0.6);
}

function progress() {
  tl.fromTo("#progress", { autoAlpha: 0, y: -16 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "expo.out" }, T.r[0] + 0.05);
  tl.set("#progress", { autoAlpha: 0 }, T.cta);
  $$("#progress b").forEach((b, i) => tl.fromTo(b, { scaleX: 0 }, { scaleX: 1, duration: REASON, ease: "none" }, T.r[i]));
}

// Gemeinsamer Ablauf jedes Grundes: Nummer, Headline, Unterzeile, Visual, Abgang nach oben
function reason(i) {
  const s = T.r[i];
  const sel = `#g${i + 1}`;
  const next = i < 4 ? T.r[i + 1] : T.cta;
  show(sel, s, next);
  reveal(`${sel} .num .ln`, s + 0.02, 0, 0.7);
  reveal(`${sel} .rh .ln`, s + 0.1, 0.08, 0.9);
  reveal(`${sel} .rs .ln`, s + 0.32, 0.06, 0.8);
  tl.fromTo(`${sel} .vis`, { autoAlpha: 0, y: 90 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "expo.out" }, s + 0.25);
  if (i < 4) {
    conceal(`${sel} .num .ln, ${sel} .rh .ln, ${sel} .rs .ln`, next - 0.36, 0.02, 0.32);
    tl.to(`${sel} .vis`, { autoAlpha: 0, y: -80, duration: 0.32, ease: "power3.in" }, next - 0.34);
    cue("whoosh", next - 0.36, { dir: 0 });
    FAST.push([next - 0.38, next + 0.1]);
  } else {
    wipe(T.cta, "#0B0B0C", { vertical: true });
  }
  cue("pop", s, { i });
  return s;
}

function reason1() {
  const s = reason(0);
  tl.fromTo("#miniRule", { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: "power3.inOut" }, s + 0.75);
  tl.to("#mini .m-total b", { scale: 1.06, transformOrigin: "left center", duration: 0.14, yoyo: true, repeat: 1 }, s + 2.1);
  cue("count", s + 0.9, { dur: 1.2 });
  cue("ding", s + 2.1);
}

function reason2() {
  const s = reason(1);
  cue("count", s + 0.1, { dur: 1.5 });
  cue("sparkle", s + 0.3, { dur: 1.9 });
}

function reason3() {
  const s = reason(2);
  tl.fromTo("#g3 .rings", { scale: 0.5, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.4, ease: "expo.out" }, s + 0.2);
  tl.fromTo("#g3 .sh-path", { strokeDasharray: "1 2", strokeDashoffset: 1.01 }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }, s + 0.3);
  tl.fromTo("#g3 .sh-fill", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, s + 0.9);
  tl.fromTo("#g3 .dcard", { autoAlpha: 0, y: 220, rotation: -16, scale: 0.9 }, { autoAlpha: 1, y: 0, rotation: -5, scale: 1, duration: 0.9, ease: "expo.out" }, s + 0.55);
  tl.fromTo("#g3 .dcard-scan", { top: "0%", opacity: 0 }, { top: "100%", opacity: 1, duration: 0.6, ease: "power1.inOut" }, s + 1.3);
  tl.to("#g3 .dcard-scan", { opacity: 0, duration: 0.12 }, s + 1.9);
  tl.fromTo("#g3 .badge", { scale: 0, rotation: -40 }, { scale: 1, rotation: 0, duration: 0.6, ease: "back.out(2.2)" }, s + 1.95);
  drawIcon("#g3 .badge", s + 2.05, 0.35);
  cue("draw", s + 0.3);
  cue("swish", s + 0.55);
  cue("scan", s + 1.3, { dur: 0.6 });
  cue("confirm", s + 1.95);
}

function reason4() {
  const s = reason(3);
  tl.fromTo("#g4 .c-row", { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: "expo.out", stagger: 0.1 }, s + 0.4);
  const c = M.toggle;
  tl.fromTo("#g4finger", { x: c.cx + 150, y: c.cy + 380, autoAlpha: 0 }, { x: c.cx - 9, y: c.cy + 2, autoAlpha: 1, duration: 0.6, ease: "power3.out" }, s + 1.05);
  tl.to("#g4finger", { scale: 0.88, duration: 0.08, yoyo: true, repeat: 1, transformOrigin: "40% 10%" }, s + 1.65);
  tl.fromTo("#g4tap", { x: c.cx, y: c.cy, scale: 0.3, opacity: 0.9 }, { scale: 1.8, opacity: 0, duration: 0.55, ease: "power2.out", immediateRender: false }, s + 1.67);
  tl.to("#g4toggle", { backgroundColor: "#E31E24", duration: 0.2 }, s + 1.7);
  tl.to("#g4toggle b", { left: 6, duration: 0.25, ease: "power3.inOut" }, s + 1.7);
  tl.to("#g4finger", { x: "+=90", y: "+=160", autoAlpha: 0, duration: 0.5, ease: "power2.in" }, s + 2.2);
  cue("click", s + 1.65);
  cue("toggle", s + 1.7);
}

function reason5() {
  const s = reason(4);
  $$("#g5 .tile").forEach((tile, i) => {
    const at = s + 0.4 + i * 0.18;
    tl.fromTo(tile, { autoAlpha: 0, y: 60, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: "back.out(1.6)" }, at);
    drawIcon(tile.querySelector(".t-ic b"), at + 0.12, 0.5);
    cue("pop", at, { i: i + 3 });
  });
}

function drawMap(t) {
  const lt = t - T.r[1];
  if (lt < -0.1 || lt > REASON + 0.2) return;
  const [x0, y0, x1, y1] = MAP.deBounds;
  const gx = (x0 + x1) / 2;
  const gy = (y0 + y1) / 2;
  const S = 1.0 + 0.08 * E.inOutSine(clamp(lt / REASON));
  mctx.setTransform(1, 0, 0, 1, 0, 0);
  mctx.clearRect(0, 0, 1080, 520);
  mctx.setTransform(S, 0, 0, S, 540 - gx * S, 270 - gy * S);
  drawDots(mctx, lt * 1.15, { dot: 2.5, station: 3.8, glow: 10, alpha: 1.5 });
}

function seek(t) {
  tl.seek(t, false);
  counter($("#g1num"), t, T.r[0] + 0.9, T.r[0] + 2.1, 10000);
  counter($("#g2num"), t, T.r[1] + 0.1, T.r[1] + 1.6, 2200);
  const locked = t >= T.r[3] + 1.7;
  const st = $("#g4state");
  setText(st, locked ? "gesperrt" : "aktiv");
  st.classList.toggle("lock", locked);
  drawMap(t);
  K.drawExpand(t);
  drawAmbient(t);
  K.drawGrain(t);
}

async function init() {
  await K.loadAssets({ extra: [fetch("data/europe-dots.json").then((r) => r.json()).then((d) => (MAP = d))] });
  drawAmbient = K.createAmbient({ keys: AMB_KEYS });
  K.initGrain();
  mctx = $("#map").getContext("2d");
  drawDots = createDotMap(MAP, { routes: false });
  M.toggle = rectOf($("#g4toggle"));

  hook();
  progress();
  reason1();
  reason2();
  reason3();
  reason4();
  reason5();
  show("#end", T.cta, T.end + 10);
  endCard(K, T.cta, T.end);

  K.publish({ duration: T.end, seek, T, cover: 1.5, music: MUSIC });
}

init();

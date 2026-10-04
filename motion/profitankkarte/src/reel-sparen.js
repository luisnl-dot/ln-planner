/* global gsap */
// Instagram Reel „4 Cent“ (1080x1920, 16 s)
// Hook-Frage → Rechenbeispiel → Originalkarte + Beweise → Endcard „Link in Bio“.
import { $, $$ } from "./engine.js";
import { createReel, cardIn, endCard } from "./reel-kit.js";

// Szenenplan in Sekunden (120 BPM, Schnitte auf Zählzeiten)
const T = { hook: 0, calc: 3, brand: 8, cta: 13, end: 16 };

// Musikplan für scripts/audio.py: Groove ab dem ersten Frame, Schlussakkord auf der Endcard,
// danach laufen Hi-Hats und Bass weiter, damit der Loop nahtlos neu startet.
const MUSIC = {
  lufs: -14,
  cycleStartBar: 0,
  groove: [[0, 13]],
  claps: [[0, 13]],
  openHats: [[8, 13]],
  lift: [[8, 13]],
  outro: [[13, 16]],
  end: 13,
  melody: [[8.0, 76], [8.5, 81], [9.0, 84]],
};

const AMB_KEYS = [[0, 0.55], [2.9, 0.55], [3.0, 0.35], [7.9, 0.35], [8.0, 0.9], [12.9, 0.9], [13.0, 0.8], [99, 0.8]];

const K = createReel();
const { tl, cue, FAST, show, reveal, conceal, wipe, drawIcon, counter } = K;
let drawAmbient;

function hook() {
  const s = T.hook;
  show("#r1", s, T.calc);
  // Erstes Bild: die rote 4 steht sofort, der Rest baut sich in den ersten Frames auf
  tl.fromTo("#four", { scale: 1.22 }, { scale: 1, duration: 0.7, ease: "expo.out" }, s);
  tl.fromTo("#r1 .glow", { autoAlpha: 0.4, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 1.2, ease: "power2.out" }, s);
  reveal("#r1 .q .ln", s + 0.1, 0, 0.8);
  reveal("#r1 .m-unit .ln", s + 0.28, 0, 0.8);
  reveal("#r1 .sub .ln", s + 0.95, 0, 0.8);
  // Puls auf dem Beat
  tl.to("#four", { scale: 1.04, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.out" }, s + 1.0);
  tl.to("#four", { scale: 1.04, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.out" }, s + 2.0);
  // Abgang nach oben
  conceal("#r1 .q .ln, #r1 .m-unit .ln, #r1 .sub .ln", T.calc - 0.42, 0.03, 0.36);
  tl.to("#four", { yPercent: -45, autoAlpha: 0, duration: 0.4, ease: "power3.in" }, T.calc - 0.4);
  FAST.push([s, s + 0.3], [T.calc - 0.45, T.calc]);
  cue("impact", s);
  cue("swish", s + 0.1);
  cue("swish", s + 0.28);
  cue("swish", s + 0.95);
  cue("whoosh", T.calc - 0.45, { dir: 0 });
}

function calc() {
  const s = T.calc;
  show("#r2", s, T.brand);
  reveal("#r2 .kicker .ln", s + 0.05);
  tl.fromTo("#rA", { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "expo.out" }, s + 0.08);
  tl.fromTo("#rB", { autoAlpha: 0, scale: 1.25, transformOrigin: "left center" }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(2)" }, s + 1.5);
  tl.fromTo("#rule", { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: "power3.inOut" }, s + 2.0);
  tl.fromTo("#rC", { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "expo.out" }, s + 2.3);
  tl.to("#total", { scale: 1.07, duration: 0.16, ease: "power2.out", yoyo: true, repeat: 1 }, s + 3.85);
  tl.fromTo("#note", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, s + 3.2);
  cue("count", s + 0.2, { dur: 1.2 });
  cue("land", s + 1.5);
  cue("zip", s + 2.0);
  cue("count", s + 2.45, { dur: 1.4 });
  cue("ding", s + 3.85);
  wipe(T.brand, "#0B0B0C", { vertical: true });
}

function brand() {
  const s = T.brand;
  show("#r3", s, T.cta);
  tl.fromTo("#r3 .glow", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.5 }, s);
  reveal("#r3 .head .ln", s + 0.15, 0.09, 1.0);
  cardIn(K, "#c3", s + 0.05, { dur: 1.6, sheenAt: s + 0.95 });
  reveal("#r3 .brand .ln", s + 0.9);
  // Karte rückt nach oben, darunter erscheinen die Beweise
  conceal("#r3 .head .ln", s + 2.25, 0.04);
  conceal("#r3 .brand .ln", s + 2.25);
  tl.to("#c3", { y: -372, scale: 0.84, duration: 0.75, ease: "power3.inOut" }, s + 2.3);
  $$("#r3 .chip").forEach((c, i) => {
    const at = s + 2.75 + i * 0.25;
    tl.fromTo(c, { autoAlpha: 0, x: -70 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: "back.out(1.6)" }, at);
    drawIcon(c.querySelector(".c-ic b"), at + 0.12, 0.5);
    cue("pop", at, { i: i + 2 });
  });
  tl.to("#r3 .chip", { autoAlpha: 0, x: 60, duration: 0.35, ease: "power3.in", stagger: 0.05 }, T.cta - 0.6);
  tl.to("#c3", { autoAlpha: 0, duration: 0.3 }, T.cta - 0.45);
  wipe(T.cta, "#0B0B0C", { vertical: true });
}

function cta() {
  show("#end", T.cta, T.end + 10);
  endCard(K, T.cta, T.end);
}

function seek(t) {
  tl.seek(t, false);
  counter($("#litNum"), t, T.calc + 0.2, T.calc + 1.4, 250000);
  counter($("#eurNum"), t, T.calc + 2.45, T.calc + 3.85, 10000);
  K.drawExpand(t);
  drawAmbient(t);
  K.drawGrain(t);
}

async function init() {
  await K.loadAssets();
  drawAmbient = K.createAmbient({ keys: AMB_KEYS });
  K.initGrain();
  hook();
  calc();
  brand();
  cta();
  K.publish({ duration: T.end, seek, T, cover: 1.9, music: MUSIC });
}

init();

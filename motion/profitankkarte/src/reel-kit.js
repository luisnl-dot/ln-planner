/* global gsap */
// Gemeinsame Bausteine der Instagram Reels (1080x1920): Engine im Hochformat,
// 3D-Einflug der Originalkarte und die Endcard mit Call-to-Action.
import { createEngine, params } from "./engine.js";

export const W = 1080;
export const H = 1920;

export function createReel() {
  if (params.has("safe")) document.body.classList.add("safe");
  return createEngine({ width: W, height: H });
}

// Originalkarte fliegt in 3D ein und schwebt danach leicht.
export function cardIn(K, sel, at, { dur = 1.6, floatFor = 0, sheenAt = null, from = {}, to = {} } = {}) {
  const { tl, cue } = K;
  const card = `${sel} .card`;
  tl.fromTo(
    card,
    { rotationY: -62, rotationX: 38, rotationZ: -14, x: -120, y: 420, z: -260, autoAlpha: 0, ...from },
    { rotationY: -12, rotationX: 10, rotationZ: -3, x: 0, y: 0, z: 0, autoAlpha: 1, duration: dur, ease: "expo.out", ...to },
    at,
  );
  tl.fromTo(`${sel} .card-floor`, { autoAlpha: 0, scaleX: 0.4 }, { autoAlpha: 1, scaleX: 1, duration: dur * 0.9, ease: "expo.out" }, at + 0.15);
  if (floatFor > 0) tl.to(card, { rotationY: "+=7", rotationX: "-=4", y: -14, duration: floatFor, ease: "sine.inOut" }, at + dur);
  if (sheenAt != null) {
    tl.fromTo(`${sel} .card-sheen`, { xPercent: -150 }, { xPercent: 420, duration: 1.1, ease: "power2.inOut" }, sheenAt);
    cue("shimmer", sheenAt);
  }
  cue("cardIn", at);
}

// Endcard: Karte, Frage/Headline, roter Button, „Link in Bio" mit Hand, Absender.
export function endCard(K, s, end, { sel = "#end", shine = [1.4, 2.7] } = {}) {
  const { tl, cue, reveal, drawIcon } = K;
  tl.fromTo(`${sel} .glow`, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 2, ease: "power2.out" }, s);
  cardIn(K, `${sel} .e-card`, s + 0.05, {
    dur: 1.3,
    floatFor: end - s - 1.35,
    from: { y: 300, rotationY: -40 },
    to: { rotationY: -10, rotationX: 12 },
  });
  reveal(`${sel} .h1 .ln`, s + 0.2, 0.09, 1.0);
  tl.fromTo(`${sel} .btn-cta`, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.8, ease: "back.out(1.9)" }, s + 0.55);
  tl.fromTo(`${sel} .bio`, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "expo.out" }, s + 0.85);
  drawIcon(`${sel} .bio .hand`, s + 0.9, 0.5);
  // Hand tippt nach oben Richtung Profil (Link in Bio), endet in Ruhelage
  const bounces = Math.max(1, Math.floor((end - s - 1.5) / 0.56));
  tl.to(`${sel} .bio .hand`, { y: -18, duration: 0.28, ease: "power2.out", yoyo: true, repeat: bounces * 2 - 1 }, s + 1.35);
  reveal(`${sel} .end-brand .ln`, s + 1.05);
  shine.forEach((d, i) => {
    tl.fromTo(`${sel} .cta-shine`, { xPercent: -260 }, { xPercent: 560, duration: 0.95, ease: "power2.inOut", immediateRender: i === 0 }, s + d);
    cue("shine", s + d);
  });
  cue("impact", s);
  cue("pop", s + 0.55, { i: 6 });
}

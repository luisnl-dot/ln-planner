#!/usr/bin/env python3
"""Soundtrack + Sound-Design für das profitankkarte.de-Video.

Komplett prozedural synthetisiert (keine Samples, keine Lizenzfragen).
Liest audio/cues.json (schreibt der Renderer bzw. `npm run cues`) und erzeugt
audio/soundtrack.wav: 120 BPM, A-Moll (Am, F, C, G), Schluss auf C-Dur.
Jeder Sound-Effekt hängt an einem Cue aus der Animation und ist damit framegenau synchron.

Aufruf:  python3 scripts/audio.py
"""
import json
import subprocess
from pathlib import Path

import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
BEAT = 0.5  # 120 BPM
BAR = 4 * BEAT
rng = np.random.default_rng(2200)

data = json.loads((ROOT / "audio" / "cues.json").read_text())
DUR = float(data["duration"])
CUES = data["cues"]
N = int(round(DUR * SR))


# ----------------------------------------------------------------- Grundlagen

def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(n):
    return np.arange(n) / SR


def bus():
    return np.zeros((2, N))


def stereo(x, pan=0.0):
    """Mono → Stereo mit konstanter Leistung; pan darf ein Array sein (Fahrt)."""
    a = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    return np.vstack([x * np.cos(a), x * np.sin(a)]) * np.sqrt(2)


def place(buf, x, t0, gain=1.0, pan=0.0):
    if x.ndim == 1:
        x = stereo(x, pan)
    i0 = int(round(t0 * SR))
    if i0 < 0:
        x = x[:, -i0:]
        i0 = 0
    n = min(x.shape[1], N - i0)
    if n > 0:
        buf[:, i0:i0 + n] += gain * x[:, :n]


def sos_filter(kind, fc, order=2):
    return signal.butter(order, fc, kind, fs=SR, output="sos")


def lp(x, fc, order=2):
    return signal.sosfilt(sos_filter("lowpass", min(fc, SR * 0.45), order), x, axis=-1)


def hp(x, fc, order=2):
    return signal.sosfilt(sos_filter("highpass", fc, order), x, axis=-1)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(sos_filter("bandpass", [lo, min(hi, SR * 0.45)], order), x, axis=-1)


def saw(f, n, ph0=0.0):
    """Bandbegrenzter Sägezahn (PolyBLEP)."""
    dt = f / SR
    ph = (ph0 + dt * np.arange(n)) % 1.0
    y = 2 * ph - 1
    m = ph < dt
    x = ph[m] / dt
    y[m] -= x + x - x * x - 1
    m = ph > 1 - dt
    x = (ph[m] - 1) / dt
    y[m] -= x * x + x + x + 1
    return y


def sweep_filter(x, fc_curve, q=1.4, blk=256):
    """Bandpass mit zeitlich veränderlicher Mittenfrequenz (blockweise)."""
    n = len(x)
    y = np.zeros(n)
    zi = None
    for i in range(0, n, blk):
        fc = float(np.clip(fc_curve[min(i, n - 1)], 60, SR * 0.4))
        lo, hi = fc / (1 + 0.5 / q), fc * (1 + 0.5 / q)
        sos = sos_filter("bandpass", [lo, hi], 2)
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        y[i:i + blk], zi = signal.sosfilt(sos, x[i:i + blk], zi=zi)
    return y


def env(n, a=0.005, hold=None, r=0.2):
    t = tt(n)
    e = np.minimum(t / max(a, 1e-4), 1.0)
    if hold is not None:
        rel = t > hold
        e[rel] *= np.exp(-(t[rel] - hold) / r)
    return e


# ----------------------------------------------------------------- Instrumente

def make_kick():
    n = int(0.55 * SR)
    t = tt(n)
    f = 54 + 140 * np.exp(-t / 0.028)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.17) * (1 - np.exp(-t / 0.0012))
    knock = bp(rng.standard_normal(n), 900, 3500) * np.exp(-t / 0.006) * 0.35
    y = np.tanh(1.8 * (body + knock)) / np.tanh(1.8)
    return hp(y, 38, 2)


def make_clap():
    n = int(0.5 * SR)
    t = tt(n)
    noise = bp(rng.standard_normal(n), 900, 4200)
    e = np.zeros(n)
    for d in (0.0, 0.010, 0.021):
        i = int(d * SR)
        e[i:] += np.exp(-t[: n - i] / 0.006)
    i = int(0.021 * SR)
    e[i:] += 0.55 * np.exp(-t[: n - i] / 0.13)
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.045) * 0.25
    return noise * e * 0.55 + body


def make_hat(open_=False):
    n = int((0.4 if open_ else 0.09) * SR)
    t = tt(n)
    x = hp(rng.standard_normal(n), 7200, 4)
    return x * np.exp(-t / (0.12 if open_ else 0.017))


KICK = make_kick()
CLAP = make_clap()
HATS = [make_hat() for _ in range(4)]
OHAT = make_hat(True)


def bass_note(m, length):
    n = int((length + 0.04) * SR)
    t = tt(n)
    f = mtof(m)
    x = 0.55 * saw(f, n) + 0.45 * saw(f * 1.005, n, 0.3) + 0.35 * np.sin(2 * np.pi * f / 2 * t)
    fe = np.exp(-t / 0.07)
    y = lp(x, 420) * (1 - fe) + lp(x, 2200) * fe
    amp = (1 - np.exp(-t / 0.003)) * np.exp(-t / 0.3) * np.clip((length - t) / 0.025, 0, 1)
    return np.tanh(1.4 * y * amp)


def pad_chord(notes, length, bright=1.0, rel=0.7, attack=0.09):
    n = int((length + rel * 4) * SR)
    left = np.zeros(n)
    right = np.zeros(n)
    for m in notes:
        f = mtof(m)
        for k, det in enumerate((-0.12, -0.05, 0.0, 0.05, 0.12)):
            x = saw(f * 2 ** (det / 12), n, rng.random())
            a = ((k - 2) / 2 * 0.85 + 1) * np.pi / 4
            left += x * np.cos(a)
            right += x * np.sin(a)
    st = np.vstack([left, right]) / (len(notes) * 3.2)
    st = lp(st, 900 + 2600 * bright, 2)
    return st * env(n, attack, length, rel)


def pluck(m, dec=0.2, bright=1.0):
    f = mtof(m)
    n = int(0.7 * SR)
    t = tt(n)
    y = np.zeros(n)
    for k in range(1, 18):
        if f * k > 15000:
            break
        y += (1 / k) * np.exp(-t * (1 / dec + 11 * (k - 1) / bright)) * np.sin(2 * np.pi * f * k * t + rng.random() * 6.28)
    return y * (1 - np.exp(-t / 0.0015)) * 0.6


def bell(m, dur=1.8, index=2.0):
    f = mtof(m)
    n = int(dur * SR)
    t = tt(n)
    i = index * np.exp(-t / 0.22)
    y = np.sin(2 * np.pi * f * t + i * np.sin(2 * np.pi * f * 3.5 * t))
    y += 0.25 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.35)
    return y * np.exp(-t / (dur / 3.4)) * (1 - np.exp(-t / 0.0015))


def blip(f, dur=0.05, decay=0.012):
    n = int(dur * SR)
    t = tt(n)
    return np.sin(2 * np.pi * f * t) * np.exp(-t / decay) * (1 - np.exp(-t / 0.0008))


def tick(f=3200, gain=1.0):
    n = int(0.03 * SR)
    t = tt(n)
    x = blip(f, 0.03, 0.004) + 0.4 * hp(rng.standard_normal(n), 3000) * np.exp(-t / 0.0015)
    return x * gain


# ----------------------------------------------------------------- Sound-Design

def whoosh(dur=0.62, lo=280, hi=3200, dirn=1, gain=1.0):
    n = int(dur * SR)
    p = np.linspace(0, 1, n)
    shape = np.sin(np.pi * np.clip(p * 1.15, 0, 1)) ** 2
    fc = lo * (hi / lo) ** np.sin(np.pi * np.clip(p * 1.1, 0, 1)) ** 1.3
    x = sweep_filter(rng.standard_normal(n), fc, q=0.9)
    x = x / (np.max(np.abs(x)) + 1e-9) * shape * gain
    return stereo(x, (p * 1.6 - 0.8) * dirn)


def riser(dur, gain=1.0, top=7000):
    n = int(dur * SR)
    p = np.linspace(0, 1, n)
    fc = 350 * (top / 350) ** (p ** 1.4)
    x = sweep_filter(rng.standard_normal(n), fc, q=1.6)
    x /= np.max(np.abs(x)) + 1e-9
    f = 180 * 4 ** (p ** 1.6)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.35 + 0.2 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    y = (x + tone) * (p ** 2.4) * gain
    y[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
    return stereo(y, 0.0)


def impact(gain=1.0, soft=False):
    n = int(3.2 * SR)
    t = tt(n)
    f = 42 + 60 * np.exp(-t / 0.09)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.6 if soft else 1.0))
    crack = lp(rng.standard_normal(n), 2400 if soft else 4200) * np.exp(-t / (0.08 if soft else 0.16))
    y = np.tanh(1.5 * (boom * 0.9 + crack * (0.35 if soft else 0.55)))
    y[-int(0.4 * SR):] *= np.linspace(1, 0, int(0.4 * SR))
    return hp(y, 32, 2) * gain


def keyclick(gain=1.0):
    n = int(0.05 * SR)
    t = tt(n)
    f = rng.uniform(1700, 2600)
    x = hp(rng.standard_normal(n), 1800) * np.exp(-t / 0.004) + 0.35 * np.sin(2 * np.pi * f * 0.22 * t) * np.exp(-t / 0.01)
    return x * gain * rng.uniform(0.65, 1.0)


def mouse_click():
    n = int(0.09 * SR)
    t = tt(n)
    down = hp(rng.standard_normal(n), 2500) * np.exp(-t / 0.0025)
    body = np.sin(2 * np.pi * 900 * t) * np.exp(-t / 0.008) * 0.5
    up = np.zeros(n)
    i = int(0.055 * SR)
    up[i:] = hp(rng.standard_normal(n - i), 3000) * np.exp(-t[: n - i] / 0.002) * 0.45
    return down + body + up


def pop(f0):
    n = int(0.16 * SR)
    t = tt(n)
    f = f0 * (0.55 + 0.45 * np.exp(-t / 0.025))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.05) * (1 - np.exp(-t / 0.001))


def noise_bed(dur, lo, hi, attack, release, gain=1.0):
    n = int(dur * SR)
    x = bp(rng.standard_normal(n), lo, hi)
    x /= np.max(np.abs(x)) + 1e-9
    return x * env(n, attack, dur - release, release / 3) * gain


# ----------------------------------------------------------------- Musik

drums, bassb, padb, pluckb, bellb, sfx, send = bus(), bus(), bus(), bus(), bus(), bus(), bus()

CHORDS = {
    "Am": dict(root=33, pad=[57, 60, 64, 71], arp=[69, 72, 76, 79]),
    "F": dict(root=29, pad=[53, 57, 60, 64], arp=[65, 69, 72, 76]),
    "C": dict(root=36, pad=[55, 60, 64, 74], arp=[67, 72, 76, 79]),
    "G": dict(root=31, pad=[55, 59, 62, 69], arp=[67, 71, 74, 79]),
}
CYCLE = ["Am", "F", "C", "G"]


def chord_at(t):
    b = int(t // BAR)
    return CYCLE[(b - 2) % 4] if b >= 2 else "Am"


def inside(t, ranges):
    return any(a <= t < b for a, b in ranges)


GROOVE = [(4.0, 35.0), (36.5, 42.5)]
CLAPS = [(4.0, 19.0), (25.0, 35.0), (36.5, 42.5)]
OPEN_HATS = [(30.0, 35.0), (38.5, 42.5)]
END = 43.0
kicks = []

# Drums
steps = int(DUR / (BEAT / 4))
for s in range(steps):
    t = s * BEAT / 4
    pos = s % 16
    if inside(t, GROOVE) and pos % 4 == 0:
        place(drums, KICK, t, 0.85)
        kicks.append(t)
    if inside(t, CLAPS) and pos in (4, 12):
        place(drums, CLAP, t, 0.6, 0.05)
        place(send, CLAP, t, 0.12)
    in_intro = 0.5 <= t < 4.0
    if inside(t, GROOVE) or in_intro:
        accent = 1.0 if pos % 4 == 2 else (0.55 if pos % 2 == 0 else 0.4)
        g = 0.17 * accent * (0.35 + 0.65 * (t - 0.5) / 3.5 if in_intro else 1.0)
        place(drums, HATS[s % 4], t + rng.uniform(-0.002, 0.002), g, 0.25)
    if inside(t, OPEN_HATS) and pos % 4 == 2:
        place(drums, OHAT, t, 0.1, -0.2)

# Bass: Achtel auf der Offbeat-Zählzeit (pumpend)
for s in range(int(DUR / (BEAT / 2))):
    t = s * BEAT / 2
    if inside(t, GROOVE) and s % 2 == 1:
        place(bassb, bass_note(CHORDS[chord_at(t)]["root"] + 12, BEAT / 2 * 0.92), t, 0.36)

# Intro-Drone + Pad, das sich öffnet
n0 = int(4.2 * SR)
tdr = tt(n0)
drone = (0.5 * saw(55, n0) + 0.5 * saw(55.2, n0, 0.5))
drone = lp(drone, 520) * np.minimum(tdr / 1.2, 1) * 0.55 + 0.15 * np.sin(2 * np.pi * 55 * tdr) * np.minimum(tdr / 0.8, 1)
place(bassb, drone * np.clip((4.05 - tdr) / 0.05, 0, 1), 0.0, 0.5)
place(padb, pad_chord(CHORDS["Am"]["pad"], 3.9, bright=0.15, rel=0.3, attack=1.6), 0.0, 0.55)

# Pads je Takt ab dem Drop
for b in range(2, int(END // BAR) + 1):
    t0 = b * BAR
    if t0 >= END:
        break
    length = min(BAR, END - t0)
    bright = 0.55 if 19.0 <= t0 < 25.0 else 0.85
    place(padb, pad_chord(CHORDS[chord_at(t0)]["pad"], length, bright=bright, rel=0.5), t0, 0.5)
    place(send, pad_chord(CHORDS[chord_at(t0)]["pad"], length, bright=0.4, rel=0.5), t0, 0.08)

# Schlussakkord C-Dur (add9) mit langem Ausklang
final_pad = pad_chord([48, 55, 60, 64, 67, 74], 3.2, bright=0.9, rel=0.9, attack=0.02)
place(padb, final_pad, END, 0.62)
place(send, final_pad, END, 0.2)

# Pluck-Arpeggio
ARP = [0, 1, 2, 3, 2, 1, 2, 3]
for s in range(int(DUR / (BEAT / 4))):
    t = s * BEAT / 4
    c = CHORDS[chord_at(t)]
    if 2.0 <= t < 4.0 and s % 2 == 0:  # Vorbote im Intro
        g = 0.05 + 0.1 * (t - 2.0) / 2.0
        place(pluckb, pluck(c["arp"][ARP[s % 8]], 0.12, 0.5), t, g, 0.3 * (1 if s % 4 else -1))
    if inside(t, GROOVE):
        sparse = 19.0 <= t < 25.0
        if sparse and s % 2:
            continue
        note = c["arp"][ARP[s % 8]] + (12 if (14.0 <= t < 19.0 and s % 8 == 7) else 0)
        place(pluckb, pluck(note, 0.17), t, 0.2, 0.35 * (1 if (s // 2) % 2 else -1))
# Ausklang-Arpeggio auf C-Dur
for i, (dt, m) in enumerate([(0.5, 72), (0.75, 76), (1.0, 79), (1.25, 84), (1.75, 79), (2.25, 76), (2.75, 72)]):
    place(pluckb, pluck(m, 0.35), END + dt, 0.2 * (1 - i * 0.09), 0.4 * (1 if i % 2 else -1))

# Glocken-Motiv im CTA-Teil
for t, m in [(36.5, 76), (37.0, 81), (38.0, 84), (38.5, 81), (39.0, 77), (40.0, 79), (42.0, 86)]:
    place(bellb, bell(m, 1.6), t, 0.16, 0.15)
for m in (72, 79, 84):
    place(bellb, bell(m, 3.6, 1.6), END, 0.13)

# Sidechain-Ducking auf Kick
duck = np.ones(N)
tk = tt(int(0.4 * SR))
shape = 1 - 0.6 * np.exp(-tk / 0.11)
for k in kicks:
    i = int(k * SR)
    n = min(len(shape), N - i)
    duck[i:i + n] = np.minimum(duck[i:i + n], shape[:n])
for b in (bassb, padb, pluckb):
    b *= duck

# ----------------------------------------------------------------- Sound-Effekte je Cue

SPARKLE_NOTES = [2637, 2960, 3136, 3520, 3951, 4186]
POPS = [880, 1047, 1175, 1319, 1568, 1760, 1047]

for c in CUES:
    t = c["t"]
    k = c["type"]
    if k == "whoosh":
        place(sfx, whoosh(dirn=c.get("dir", 1)), t, 0.95)
        place(send, whoosh(dirn=c.get("dir", 1)), t, 0.12)
    elif k == "whooshUp":
        place(sfx, riser(0.55, 0.9, 9000), t, 0.9)
        place(sfx, whoosh(0.55, 400, 5000), t, 0.6)
    elif k == "riser":
        place(sfx, riser(c["dur"], 1.0), t, 0.32 if c.get("soft") else 0.5)
    elif k == "impact":
        place(sfx, impact(), t, 0.95)
        place(send, impact(), t, 0.3)
        place(drums, KICK, t, 0.9)
    elif k == "impactSoft":
        place(sfx, impact(soft=True), t, 0.55)
        place(send, impact(soft=True), t, 0.15)
    elif k == "swish":
        place(sfx, whoosh(0.32, 1800, 7000), t - 0.05, 0.24)
    elif k == "zip":
        place(sfx, whoosh(0.45, 900, 6500, 1), t, 0.3)
    elif k == "lcd":
        for i, f in enumerate((1980, 2640)):
            place(sfx, blip(f, 0.05, 0.02) * 0.6, t + i * 0.07, 0.16, 0.3)
        place(sfx, noise_bed(0.25, 80, 400, 0.01, 0.15, 0.4), t, 0.14, 0.3)
    elif k == "pumpRun":
        d = c["dur"]
        n = int(d * SR)
        tr = tt(n)
        hum = (np.sin(2 * np.pi * 98 * tr) + 0.5 * np.sin(2 * np.pi * 196 * tr) + 0.25 * np.sin(2 * np.pi * 294 * tr)) * (1 + 0.15 * np.sin(2 * np.pi * 6 * tr))
        hum = hum * env(n, 0.25, d - 0.06, 0.02) * 0.35 + noise_bed(d, 200, 1400, 0.25, 0.06, 0.25)
        place(sfx, hum, t, 0.22, 0.35)
        tk_t = 0.0
        while tk_t < d:
            rate = 6 + 16 * min(tk_t / 0.35, 1)
            place(sfx, tick(1500 + rng.uniform(-80, 80), 0.6), t + tk_t, 0.11, 0.4)
            tk_t += 1 / rate
    elif k == "pumpStop":
        place(sfx, impact(soft=True)[: int(0.3 * SR)] * np.exp(-tt(int(0.3 * SR)) / 0.05), t, 0.35, 0.35)
        place(sfx, mouse_click(), t, 0.35, 0.35)
    elif k == "cardIn":
        place(sfx, whoosh(0.7, 180, 1800, 1), t, 0.8)
    elif k in ("shimmer", "shine"):
        dur = 0.9 if k == "shimmer" else 0.7
        x = noise_bed(dur, 6000, 14000, dur * 0.45, dur * 0.5, 1.0)
        place(sfx, x, t, 0.09 if k == "shimmer" else 0.06, 0.2)
        place(send, x, t, 0.05)
    elif k == "roll":
        for i in range(10):
            p = (i + 1) / 10
            u = 1 - (1 - p) ** 0.25
            place(sfx, tick(2600 + 90 * i, 0.9), t + u * 1.3 * 0.75, 0.2, -0.15)
    elif k == "land":
        thud = np.sin(2 * np.pi * np.cumsum(70 + 90 * np.exp(-tt(int(0.25 * SR)) / 0.03)) / SR) * np.exp(-tt(int(0.25 * SR)) / 0.07)
        place(sfx, thud, t, 0.5)
        place(sfx, tick(4000), t, 0.25)
    elif k == "count":
        steps_n = 18 if not c.get("soft") else 12
        for i in range(steps_n):
            p = (i + 1) / steps_n
            u = 1 - (1 - p) ** (1 / 3)
            place(sfx, tick(2900 + 40 * i, 0.8), t + u * c["dur"], 0.16 if not c.get("soft") else 0.08, 0.1)
    elif k == "ding":
        place(bellb, bell(84, 2.0, 1.4), t, 0.24)
        place(send, bell(84, 2.0, 1.4), t, 0.1)
    elif k == "sparkle":
        d = c["dur"]
        for i in range(70):
            u = rng.random() ** 1.8
            place(sfx, blip(rng.choice(SPARKLE_NOTES), 0.06, 0.015), t + u * d, 0.045 * rng.uniform(0.5, 1), rng.uniform(-0.8, 0.8))
    elif k == "route":
        place(sfx, noise_bed(c["dur"], 900, 3500, 0.6, 0.8, 1.0), t, 0.05, 0.3)
    elif k == "draw":
        x = noise_bed(1.0, 2500, 7000, 0.15, 0.4, 1.0) * (0.75 + 0.25 * np.sin(2 * np.pi * 23 * tt(int(1.0 * SR))))
        place(sfx, x, t, 0.06, 0.4)
    elif k == "tick":
        place(sfx, tick(3500), t, 0.22, -0.3)
        place(bellb, bell(88, 0.6, 0.8), t, 0.06, -0.3)
    elif k == "scan":
        n = int(c["dur"] * SR)
        tr = tt(n)
        f = 900 * 2 ** (tr / c["dur"])
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 28 * tr)) * env(n, 0.04, c["dur"] - 0.1, 0.03)
        place(sfx, x, t, 0.07, 0.4)
    elif k == "confirm":
        place(bellb, bell(88, 1.4, 1.2), t, 0.2, 0.35)
        place(bellb, bell(93, 1.6, 1.2), t + 0.09, 0.18, 0.35)
        place(send, bell(93, 1.6, 1.2), t + 0.09, 0.08)
    elif k == "click":
        place(sfx, mouse_click(), t, 0.6, 0.35)
    elif k == "toggle":
        x = blip(1100, 0.08, 0.01) + 0.6 * blip(220, 0.08, 0.02)
        place(sfx, x, t, 0.25, 0.35)
    elif k == "pop":
        place(sfx, pop(POPS[c.get("i", 0) % len(POPS)]), t, 0.36, (c.get("i", 0) % 3 - 1) * 0.4)
        place(send, pop(POPS[c.get("i", 0) % len(POPS)]), t, 0.06)
    elif k == "key":
        place(sfx, keyclick(), t, 0.24, 0.38)
    elif k == "success":
        for i, m in enumerate((84, 88, 91)):
            place(bellb, bell(m, 1.8, 1.3), t + i * 0.075, 0.17, 0.2)
            place(send, bell(m, 1.8, 1.3), t + i * 0.075, 0.07)

# ----------------------------------------------------------------- Raum & Mix

def make_ir(seconds=2.3, decay=0.55):
    n = int(seconds * SR)
    t = tt(n)
    ir = rng.standard_normal((2, n)) * np.exp(-t / decay)
    ir = lp(hp(ir, 300), 6500)
    ir[:, : int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


IR = make_ir()
wet = np.vstack([signal.fftconvolve(send[i], IR[i])[:N] for i in range(2)])
wet += 0.35 * np.vstack([signal.fftconvolve((padb + pluckb + bellb)[i], IR[i])[:N] for i in range(2)])

music = 0.95 * drums + 0.9 * bassb + 1.5 * padb + 1.55 * pluckb + 1.15 * bellb
# Musik tritt bei großen Effekten kurz zurück (max. ca. -3,5 dB)
lvl = np.sqrt(np.convolve(np.mean(sfx ** 2, axis=0), np.ones(int(0.05 * SR)) / int(0.05 * SR), mode="same"))
lvl = signal.sosfilt(sos_filter("lowpass", 6, 1), lvl)
duck_sfx = 1 - 0.33 * np.clip(lvl / (np.percentile(lvl, 99.5) + 1e-9), 0, 1)
mix = music * 0.82 * duck_sfx + 1.0 * sfx + 0.32 * wet
mix = hp(mix, 32, 4)
# Tiefen-Shelf etwas absenken, Höhen-Shelf für Präsenz auf kleinen Lautsprechern
low = lp(mix, 90, 2)
high = hp(mix, 7000, 2)
mix = mix - 0.42 * low + 0.3 * high

# Ausblenden der letzten 1,2 s
fade = int(1.2 * SR)
mix[:, -fade:] *= np.cos(np.linspace(0, np.pi / 2, fade)) ** 2

# sanfte Sättigung statt hartem Clipping
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.25) / np.tanh(1.25)

raw = ROOT / "audio" / ".raw.wav"
wavfile.write(raw, SR, (mix.T * 0.89).astype(np.float32))

# Lautheit für Web: -16 LUFS integriert, True Peak -1,5 dBTP (zwei Durchgänge)
out = ROOT / "audio" / "soundtrack.wav"
meas = subprocess.run(
    ["ffmpeg", "-hide_banner", "-i", str(raw), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
    capture_output=True, text=True,
).stderr
js = json.loads(meas[meas.rindex("{"): meas.rindex("}") + 1])
af = (
    f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
    f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true,"
    "alimiter=limit=0.75:attack=4:release=60:level=disabled"
)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af", af, "-ar", str(SR), "-c:a", "pcm_s16le", str(out)], check=True)
raw.unlink()
print(f"→ {out}  (gemessen vorher: {js['input_i']} LUFS, Ziel -16 LUFS)")

#!/usr/bin/env python3
"""Sound kit for the show-dont-tell reel, rendered in pure numpy.

    python3 scripts/synth_audio.py          (from the project root, or anywhere)

Writes
    public/audio/score.wav          20.000 s, 96 BPM, 48 kHz stereo 16-bit
    public/audio/sfx/*.wav          48 kHz mono 16-bit one-shots, peak -6 dBFS
    public/audio/beats.json         the 32 beat onsets MEASURED from score.wav

Grid: 96 BPM, beat = 0.625 s = 18.75 frames at 30 fps, 32 beats = 20 s.

Score structure (bar = 4 beats = 2.5 s)
    0.000   bar 0   kick on beats 1+3, click on every beat, soft hats, pad closed, vinyl bed
    2.500   bar 1   pad low-pass OPENS over bar 1, two-note bass line enters (A minor)
    5.000   bar 2   Fmaj9
   10.000   bar 4   Dm9
   14.000           BREAKDOWN: kick, bass and hats drop, pad closes, noise riser
   16.250   beat 26 RESOLVE: kick/bass/hats return, pad re-opens and rises
   19.375   beat 31 final Am9 chord lands, tails to silence by 20.000

Filters: static one-pole / biquad IIRs are applied through their (long) impulse response
with an FFT convolution (vectorised, exact to ~1e-9); time-varying ones (filter sweeps)
run as a per-sample trapezoidal state-variable filter loop.
Everything is deterministic (fixed seed, fixed call order).
"""
from __future__ import annotations

import json
import math
import os
import time
import wave

import numpy as np

SR = 48_000
BPM = 96.0
BEAT = 60.0 / BPM            # 0.625 s
N_BEATS = 32
DUR = N_BEATS * BEAT         # 20.0 s
N = int(round(DUR * SR))     # 960000 samples
FPS = 30
SEED = 20261014

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
AUDIO_DIR = os.path.join(ROOT, "public", "audio")
SFX_DIR = os.path.join(AUDIO_DIR, "sfx")

TARGET_LUFS = -18.0          # pre-master level; scripts/master.sh brings the final mix to -14
TP_CEILING_DB = -3.5         # limiter ceiling, keeps true peak at or below -3 dBTP
BED_DBFS = -40.0             # vinyl noise bed, RMS

rng = np.random.default_rng(SEED)


# ----------------------------------------------------------------------------- helpers
def sec(t: float) -> int:
    return int(round(t * SR))


def db(x: float) -> float:
    return 10.0 ** (x / 20.0)


def tt(n: int) -> np.ndarray:
    return np.arange(n) / SR


def norm(x: np.ndarray, peak: float = 1.0) -> np.ndarray:
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 0 else x


def expdec(n: int, tau: float) -> np.ndarray:
    return np.exp(-tt(n) / tau)


def attack(n: int, t_att: float) -> np.ndarray:
    if t_att <= 0:
        return np.ones(n)
    return 1.0 - np.exp(-tt(n) / t_att)


def fade(x: np.ndarray, f_in: float = 0.0, f_out: float = 0.005) -> np.ndarray:
    """Raised-cosine edges so one-shots never start or stop on a DC step."""
    y = x.copy()
    n = len(y)
    ni, no = min(sec(f_in), n), min(sec(f_out), n)
    if ni > 1:
        w = 0.5 - 0.5 * np.cos(np.pi * np.arange(ni) / ni)
        y[:ni] *= w.reshape(-1, *([1] * (y.ndim - 1)))
    if no > 1:
        w = 0.5 + 0.5 * np.cos(np.pi * np.arange(no) / no)
        y[n - no:] *= w.reshape(-1, *([1] * (y.ndim - 1)))
    return y


def saw(freq, n: int, phase: float = 0.0) -> np.ndarray:
    """Naive sawtooth, freq scalar or per-sample array."""
    if np.isscalar(freq):
        ph = phase + freq * np.arange(n) / SR
    else:
        ph = phase + np.cumsum(np.asarray(freq, float)) / SR
    return 2.0 * (ph % 1.0) - 1.0


def sine(freq, n: int, phase: float = 0.0) -> np.ndarray:
    if np.isscalar(freq):
        ph = phase + freq * np.arange(n) / SR
    else:
        ph = phase + np.cumsum(np.asarray(freq, float)) / SR
    return np.sin(2.0 * np.pi * ph)


def noise(n: int) -> np.ndarray:
    return rng.standard_normal(n)


# ----------------------------------------------------------------------------- filters
def biquad(kind: str, fc: float, q: float, sr: int = SR):
    """RBJ cookbook biquad. Returns (b, a) with a[0] == 1."""
    w0 = 2.0 * math.pi * fc / sr
    c, s = math.cos(w0), math.sin(w0)
    al = s / (2.0 * q)
    if kind == "lp":
        b = ((1 - c) / 2, 1 - c, (1 - c) / 2)
    elif kind == "hp":
        b = ((1 + c) / 2, -(1 + c), (1 + c) / 2)
    elif kind == "bp":  # constant 0 dB peak gain
        b = (al, 0.0, -al)
    else:
        raise ValueError(kind)
    a = (1 + al, -2 * c, 1 - al)
    return np.array(b) / a[0], np.array(a) / a[0]


def onepole_lp_coeffs(fc: float):
    a = math.exp(-2.0 * math.pi * fc / SR)
    return np.array([1 - a, 0.0, 0.0]), np.array([1.0, -a, 0.0])


def _impulse(b, a, n: int) -> np.ndarray:
    """Impulse response of a direct-form-II-transposed IIR, n samples (short loop)."""
    b0, b1, b2 = (float(v) for v in b)
    a1, a2 = float(a[1]), float(a[2])
    h = [0.0] * n
    z1 = z2 = 0.0
    for i in range(n):
        xn = 1.0 if i == 0 else 0.0
        yn = b0 * xn + z1
        z1 = b1 * xn - a1 * yn + z2
        z2 = b2 * xn - a2 * yn
        h[i] = yn
    return np.array(h)


def _fftconv(x: np.ndarray, h: np.ndarray) -> np.ndarray:
    n = len(x) + len(h) - 1
    nf = 1 << (n - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, nf) * np.fft.rfft(h, nf), nf)
    return y[: len(x)]


def iir(x: np.ndarray, b, a, hlen: int = 1 << 16) -> np.ndarray:
    """Static IIR (one-pole or biquad) applied via its impulse response, vectorised."""
    h = _impulse(b, a, min(hlen, len(x)))
    if x.ndim == 2:
        return np.stack([_fftconv(x[:, c], h) for c in range(x.shape[1])], axis=1)
    return _fftconv(x, h)


def lp1(x, fc):
    return iir(x, *onepole_lp_coeffs(fc))


def hp1(x, fc):
    return x - lp1(x, fc)


def svf(x: np.ndarray, fc, q: float = 0.707, mode: str = "lp") -> np.ndarray:
    """Trapezoidal (zero-delay) state-variable filter with a per-sample cutoff.
    The classic time-varying 12 dB/oct sweep; per-sample Python loop, mono."""
    n = len(x)
    fc = np.broadcast_to(np.asarray(fc, dtype=float), (n,))
    g = np.tan(np.pi * np.clip(fc, 10.0, 20000.0) / SR)
    k = 1.0 / q
    a1 = 1.0 / (1.0 + g * (g + k))
    a2 = g * a1
    a3 = g * a2
    A1, A2, A3, X = a1.tolist(), a2.tolist(), a3.tolist(), x.tolist()
    out = [0.0] * n
    ic1 = ic2 = 0.0
    if mode == "lp":
        for i in range(n):
            v3 = X[i] - ic2
            v1 = A1[i] * ic1 + A2[i] * v3
            v2 = ic2 + A2[i] * ic1 + A3[i] * v3
            ic1 = 2.0 * v1 - ic1
            ic2 = 2.0 * v2 - ic2
            out[i] = v2
    elif mode == "hp":
        for i in range(n):
            v0 = X[i]
            v3 = v0 - ic2
            v1 = A1[i] * ic1 + A2[i] * v3
            v2 = ic2 + A2[i] * ic1 + A3[i] * v3
            ic1 = 2.0 * v1 - ic1
            ic2 = 2.0 * v2 - ic2
            out[i] = v0 - k * v1 - v2
    elif mode == "bp":
        for i in range(n):
            v3 = X[i] - ic2
            v1 = A1[i] * ic1 + A2[i] * v3
            v2 = ic2 + A2[i] * ic1 + A3[i] * v3
            ic1 = 2.0 * v1 - ic1
            ic2 = 2.0 * v2 - ic2
            out[i] = v1
    else:
        raise ValueError(mode)
    return np.array(out)


# ----------------------------------------------------------------------------- metering
def k_weight(x: np.ndarray) -> np.ndarray:
    """ITU-R BS.1770-4 K-weighting at 48 kHz (high shelf, then RLB high-pass)."""
    b1 = (1.53512485958697, -2.69169618940638, 1.19839281085285)
    a1 = (1.0, -1.69065929318241, 0.73248077421585)
    b2 = (1.0, -2.0, 1.0)
    a2 = (1.0, -1.99004745483398, 0.99007225036621)
    return iir(iir(x, b1, a1), b2, a2)


def integrated_lufs(x: np.ndarray) -> float:
    """BS.1770-4 integrated loudness with absolute (-70) and relative (-10) gating."""
    y = k_weight(x if x.ndim == 2 else x[:, None])
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    c = np.cumsum(np.concatenate([np.zeros((1, y.shape[1])), y * y], axis=0), axis=0)
    starts = np.arange(0, len(y) - blk + 1, hop)
    ms = ((c[starts + blk] - c[starts]) / blk).sum(axis=1)  # channel weights 1.0
    lk = -0.691 + 10.0 * np.log10(ms + 1e-30)
    g1 = lk > -70.0
    if not g1.any():
        return -math.inf
    rel = -0.691 + 10.0 * np.log10(ms[g1].mean()) - 10.0
    g2 = g1 & (lk > rel)
    return -0.691 + 10.0 * np.log10(ms[g2].mean())


def oversample4(x: np.ndarray) -> np.ndarray:
    """4x band-limited oversampling by spectral zero padding (per channel)."""
    if x.ndim == 2:
        return np.stack([oversample4(x[:, c]) for c in range(x.shape[1])], axis=1)
    n = len(x)
    return np.fft.irfft(np.fft.rfft(x), 4 * n) * 4.0


def true_peak_db(x: np.ndarray) -> float:
    return 20.0 * math.log10(np.max(np.abs(oversample4(x))) + 1e-30)


def limiter(x: np.ndarray, ceiling_db: float, lookahead: float = 0.002,
            t_att: float = 0.0004, t_rel: float = 0.06) -> np.ndarray:
    """True-peak lookahead limiter. Offline, so the lookahead needs no delay line."""
    ceil_lin = db(ceiling_db)
    up = np.abs(oversample4(x)).max(axis=1) if x.ndim == 2 else np.abs(oversample4(x))
    peak = up.reshape(-1, 4).max(axis=1)          # true peak per source sample
    g_req = np.minimum(1.0, ceil_lin / np.maximum(peak, 1e-9))
    if g_req.min() >= 0.9999:
        return x
    la = sec(lookahead)
    padded = np.concatenate([g_req, np.ones(la)])
    g_win = np.lib.stride_tricks.sliding_window_view(padded, la + 1).min(axis=1)  # min over [n, n+la]
    ca, cr = math.exp(-1.0 / (t_att * SR)), math.exp(-1.0 / (t_rel * SR))
    G = g_win.tolist()
    out = [1.0] * len(G)
    g = 1.0
    for i in range(len(G)):
        tgt = G[i]
        if tgt < g:
            g = ca * g + (1.0 - ca) * tgt
        else:
            g = cr * g + (1.0 - cr) * tgt
        out[i] = g
    gain = np.array(out)
    return x * (gain[:, None] if x.ndim == 2 else gain)


# ----------------------------------------------------------------------------- wav io
def write_wav(path: str, x: np.ndarray, sr: int = SR) -> None:
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = x[:, None]
    x = np.clip(x, -1.0, 1.0)
    q = np.round(x * 32767.0).astype("<i2")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, "wb") as w:
        w.setnchannels(x.shape[1])
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(q.tobytes())


def read_wav(path: str):
    with wave.open(path, "rb") as w:
        ch, sw, sr, n = w.getnchannels(), w.getsampwidth(), w.getframerate(), w.getnframes()
        raw = w.readframes(n)
    assert sw == 2, "expected 16-bit PCM"
    x = np.frombuffer(raw, dtype="<i2").astype(np.float64).reshape(-1, ch) / 32768.0
    return x, sr


# ----------------------------------------------------------------------------- one-shots (score)
def make_kick() -> np.ndarray:
    """Sub kick: pitch drop 190 -> 44 Hz, soft-clipped body, a short knock on top."""
    n = sec(0.5)
    t = tt(n)
    f = 48.0 + (190.0 - 48.0) * np.exp(-t / 0.02)
    body = sine(f, n) * expdec(n, 0.13) * attack(n, 0.0006)
    body = np.tanh(1.6 * body) / math.tanh(1.6)
    # mid-range knock so the kick still reads on a phone speaker
    knock = iir(noise(n) * expdec(n, 0.003), *biquad("bp", 1200.0, 0.8))
    punch = sine(240.0 + 300.0 * np.exp(-t / 0.01), n) * expdec(n, 0.012) * attack(n, 0.0005)
    return fade(norm(body + 0.4 * norm(knock) + 0.3 * punch), 0.0, 0.03)


def make_click() -> np.ndarray:
    """Bright 12 ms transient on every beat: band-passed noise burst plus a 5.5 kHz ping.
    It sits in a band (3.5-7 kHz) that the bass pluck and the hats barely reach, so the
    beat detector can measure the grid even in the breakdown."""
    n = sec(0.012)
    burst = iir(noise(n) * expdec(n, 0.0006), *biquad("bp", 4500.0, 1.5))
    ping = sine(5500.0, n) * expdec(n, 0.0022)
    return fade(norm(norm(burst) + 0.6 * ping), 0.0, 0.003)


def make_hat(decay: float) -> np.ndarray:
    n = sec(decay * 6)
    x = noise(n)
    x = iir(iir(x, *biquad("hp", 7500.0, 0.8)), *biquad("hp", 7500.0, 0.8))
    x *= expdec(n, decay) * attack(n, 0.0004)
    return fade(norm(x), 0.0, 0.004)


def make_pluck(freq: float, length: float, bright: float = 1.0) -> np.ndarray:
    """Two detuned saws through a decaying low-pass, with a sub-octave sine."""
    n = sec(length)
    x = 0.5 * (saw(freq * 0.998, n, rng.random()) + saw(freq * 1.002, n, rng.random()))
    cutoff = 340.0 + (2200.0 * bright - 340.0) * expdec(n, 0.11)
    y = svf(x, cutoff, q=1.1, mode="lp")
    y *= expdec(n, 0.35) * attack(n, 0.0015)
    sub = sine(freq / 2.0, n) * expdec(n, 0.30) * attack(n, 0.004)
    return fade(norm(y + 0.5 * sub), 0.0, 0.015)


def make_final_chord() -> np.ndarray:
    """Am9 pluck-stab that lands on beat 31 and decays inside the last 0.625 s."""
    n = sec(BEAT)
    freqs = [110.0, 164.81, 220.0, 261.63, 329.63, 493.88]
    x = np.zeros(n)
    for f in freqs:
        x += saw(f * 0.997, n, rng.random()) + saw(f * 1.003, n, rng.random())
    x /= 2 * len(freqs)
    cutoff = 320.0 + 6500.0 * expdec(n, 0.12)
    y = svf(x, cutoff, q=0.9, mode="lp")
    y *= expdec(n, 0.17) * attack(n, 0.001)
    sub = sine(55.0, n) * expdec(n, 0.22) * attack(n, 0.003)
    return fade(norm(y + 0.5 * sub), 0.0, 0.02)


# ----------------------------------------------------------------------------- score layers
def place(buf: np.ndarray, i0: int, shot: np.ndarray, gain: float, pan: float = 0.0) -> None:
    """Add a mono one-shot into the stereo buffer (constant-power pan, centre = unity)."""
    n = min(len(shot), len(buf) - i0)
    if n <= 0 or i0 < 0:
        return
    th = (pan + 1.0) * math.pi / 4.0
    buf[i0:i0 + n, 0] += gain * math.cos(th) * math.sqrt(2) * shot[:n]
    buf[i0:i0 + n, 1] += gain * math.sin(th) * math.sqrt(2) * shot[:n]


BREAK_START, BREAK_END = 14.0, 16.25   # kick / bass / hats removed, pad closed
RESOLVE_END = N_BEATS * BEAT - BEAT    # 19.375 s, beat 31: the final chord


def in_break(t: float) -> bool:
    return BREAK_START <= t < BREAK_END


def kick_times() -> list[float]:
    return [n * BEAT for n in range(0, N_BEATS, 2) if not in_break(n * BEAT)]


def sidechain(times: list[float], depth: float, tau: float) -> np.ndarray:
    env = np.ones(N)
    t = tt(N)
    for tk in times:
        i0, i1 = sec(tk), min(N, sec(tk) + sec(0.8))
        d = t[i0:i1] - tk
        duck = 1.0 - depth * np.exp(-d / tau) * (1.0 - np.exp(-d / 0.004))
        env[i0:i1] = np.minimum(env[i0:i1], duck)
    return env


def render_drums() -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    kick, clicks, hats = (np.zeros((N, 2)) for _ in range(3))
    k = make_kick()
    for tk in kick_times():
        place(kick, sec(tk), k, 0.55)

    c = make_click()
    for n in range(N_BEATS):
        t = n * BEAT
        strong = (n % 2 == 0) or (n == N_BEATS - 1)      # kick beats and the final landing
        place(clicks, sec(t), c, 0.20 if strong else 0.12)

    closed, opened = make_hat(0.045), make_hat(0.16)
    for e in range(N_BEATS * 2):                          # eighths
        t = e * BEAT / 2.0
        if in_break(t) or t >= RESOLVE_END:
            continue
        off = e % 2 == 1
        vel = (0.95 if off else 0.55) * (1.0 + rng.uniform(-0.08, 0.08))
        if t < 2.5:
            vel *= 0.6                                    # under the typed hook
        open_hat = (e % 16 == 15) and t >= 2.5             # last eighth of every second bar
        place(hats, sec(t), opened if open_hat else closed, 0.085 * vel, pan=0.18 if off else -0.12)
    return kick, clicks, hats


# 16th-note pluck echo over the groove bars: chord tones an octave up, dotted-eighth echo
ARP_PATTERN = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1]


def make_arp_pluck(freq: float) -> np.ndarray:
    n = sec(0.22)
    x = 0.6 * saw(freq, n, rng.random()) + 0.4 * sine(freq, n, rng.random())
    y = svf(x, 500.0 + 1600.0 * expdec(n, 0.06), q=0.9, mode="lp")
    y *= expdec(n, 0.07) * attack(n, 0.002)
    return fade(norm(y), 0.0, 0.02)


def render_arp() -> np.ndarray:
    buf = np.zeros((N, 2))
    step = BEAT / 4.0
    echo = 3 * step                                    # dotted eighth
    cache = {}
    k = 0
    for i in range(N_BEATS * 4):
        t = i * step
        if not ARP_PATTERN[i % 16] or t < 5.0 or in_break(t) or t >= RESOLVE_END - 0.05:
            continue
        chord = next(freqs for (s, e, freqs) in CHORDS if s <= t < e)
        f = 2.0 * chord[(k * 2) % len(chord)]           # skip through the chord tones
        k += 1
        if f not in cache:
            cache[f] = make_arp_pluck(f)
        vel = 0.06 * (1.0 + rng.uniform(-0.1, 0.1))
        pan = 0.5 if k % 2 else -0.5
        place(buf, sec(t), cache[f], vel, pan=pan)
        place(buf, sec(t + echo), cache[f], vel * 0.4, pan=-pan)
    return buf


BASS_NOTES = {"A": 110.0, "C": 130.81}
# (eighth within the bar, note, length in seconds, velocity): the two-note line
BASS_PATTERN = [(1, "A", 0.55, 1.0), (3, "C", 0.26, 0.8), (5, "A", 0.42, 0.9),
                (6, "C", 0.24, 0.7), (7, "A", 0.22, 0.85)]


def render_bass() -> np.ndarray:
    buf = np.zeros((N, 2))
    cache = {}
    for bar in range(8):
        for (e, note, length, vel) in BASS_PATTERN:
            t = bar * 4 * BEAT + e * BEAT / 2.0
            if t < 2.5 or in_break(t) or t >= RESOLVE_END - 0.05:
                continue
            key = (note, length)
            if key not in cache:
                cache[key] = make_pluck(BASS_NOTES[note], length, bright=1.0 if note == "A" else 0.85)
            place(buf, sec(t), cache[key], 0.30 * vel * (1.0 + rng.uniform(-0.05, 0.05)))
    return buf


# chord segments: (start s, end s, note frequencies)
CHORDS = [
    (0.0, 5.0, [110.0, 164.81, 196.0, 246.94, 261.63]),       # Am9
    (5.0, 10.0, [87.31, 130.81, 164.81, 196.0, 220.0]),       # Fmaj9
    (10.0, 16.25, [146.83, 174.61, 220.0, 261.63, 329.63]),   # Dm9 (closed in the breakdown)
    (16.25, RESOLVE_END + 0.02, [174.61, 220.0, 261.63, 329.63, 392.0]),  # Fmaj9, higher
]
# pad low-pass cutoff keyframes (s, Hz), log-interpolated
PAD_CUTOFF = [(0.0, 170), (2.5, 170), (3.0, 420), (4.0, 1700), (5.0, 3200), (10.0, 2800),
              (13.95, 3900), (14.3, 240), (16.2, 380), (16.25, 650), (19.375, 5600), (20.0, 5600)]


def render_pad() -> np.ndarray:
    pad = np.zeros((N, 2))
    detunes = [(-0.0045, 0.0015, 0.005), (0.0045, -0.0015, -0.005)]  # L / R mirrored unison
    for (s, e, freqs) in CHORDS:
        i0, i1 = sec(s), min(N, sec(e))
        n = i1 - i0
        seg = np.zeros((n, 2))
        for f in freqs:
            for ch in range(2):
                for j, d in enumerate(detunes[ch]):
                    lfo = 1.0 + 0.0009 * sine(0.09 + 0.06 * j, n, rng.random())
                    seg[:, ch] += saw(f * (1.0 + d) * lfo, n, rng.random())
        seg = fade(seg, 0.03, 0.03)
        pad[i0:i1] += seg
    pad /= 3 * 5
    t = tt(N)
    ks, kf = zip(*PAD_CUTOFF)
    cutoff = np.exp(np.interp(t, ks, np.log(kf))) * (1.0 + 0.10 * np.sin(2 * np.pi * 0.31 * t))
    for ch in range(2):
        pad[:, ch] = svf(pad[:, ch], cutoff, q=1.3, mode="lp")
    pad = iir(pad, *biquad("hp", 90.0, 0.7))
    return norm(pad, 0.25)


def render_riser() -> np.ndarray:
    """Breakdown noise riser: high-pass sweeps 400 Hz -> 9 kHz while it swells into the resolve."""
    buf = np.zeros((N, 2))
    n = sec(BREAK_END - BREAK_START)
    fc = np.geomspace(400.0, 9000.0, n)
    x = svf(noise(n), fc, q=0.8, mode="hp") * (tt(n) / (BREAK_END - BREAK_START)) ** 2.2
    x = fade(norm(x), 0.01, 0.003)
    place(buf, sec(BREAK_START), x, 0.11)
    return buf


def render_bed() -> np.ndarray:
    """Vinyl-style bed: shaped noise with a 33 rpm wobble and sparse crackles, RMS -40 dBFS."""
    t = tt(N)
    common = noise(N)
    bed = np.stack([0.75 * common + 0.66 * noise(N), 0.75 * common + 0.66 * noise(N)], axis=1)
    bed = lp1(bed, 2800.0)
    bed = iir(bed, *biquad("hp", 120.0, 0.7))
    wobble = 1.0 + 0.35 * np.sin(2 * np.pi * (33.333 / 60.0) * t + rng.uniform(0, 2 * np.pi))
    bed *= wobble[:, None]
    bed /= np.sqrt(np.mean(bed ** 2))
    crackle = np.zeros((N, 2))
    for _ in range(26):
        i0 = int(rng.integers(0, N - 200))
        m = sec(rng.uniform(0.0004, 0.0012))
        c = noise(m) * expdec(m, 0.0002)
        place(crackle, i0, fade(norm(c), 0.0, 0.0001), rng.uniform(1.5, 4.0), pan=rng.uniform(-0.6, 0.6))
    bed = bed + crackle
    bed *= db(BED_DBFS) / np.sqrt(np.mean(bed ** 2))
    return bed


def render_score() -> np.ndarray:
    t0 = time.time()
    kick, clicks, hats = render_drums()
    print(f"  drums        {time.time() - t0:5.1f} s")
    bass = render_bass() * sidechain(kick_times(), 0.5, 0.12)[:, None]
    print(f"  bass         {time.time() - t0:5.1f} s")
    pad = render_pad() * sidechain(kick_times(), 0.6, 0.17)[:, None]
    print(f"  pad          {time.time() - t0:5.1f} s")
    arp = render_arp() * sidechain(kick_times(), 0.5, 0.12)[:, None]
    riser = render_riser()
    final = np.zeros((N, 2))
    place(final, sec(RESOLVE_END), make_final_chord(), 0.50)

    # everything but the final chord stops at beat 31 (20 ms fade), the chord tails out
    stop = np.ones(N)
    i_stop = sec(RESOLVE_END)
    stop[i_stop:] = 0.0
    stop[i_stop - sec(0.02):i_stop] = 0.5 + 0.5 * np.cos(np.pi * np.arange(sec(0.02)) / sec(0.02))
    mix = kick + clicks + bass + arp + riser + (hats + pad) * stop[:, None] + final

    # tape-style saturation and a gentle HF roll-off
    mix = np.tanh(1.25 * mix) / math.tanh(1.25)
    mix = lp1(mix, 15000.0)

    # tail to silence by 20.0 s (applied again after the bed is added)
    fo = sec(0.30)
    tail = (0.5 + 0.5 * np.cos(np.pi * np.arange(fo) / fo))[:, None]
    mix[N - fo:] *= tail
    mix[-sec(0.01):] = 0.0

    # level: integrated -18 LUFS, true peak <= -3 dBTP
    for _ in range(3):
        lu = integrated_lufs(mix)
        mix *= db(TARGET_LUFS - lu)
        mix = limiter(mix, TP_CEILING_DB)
    print(f"  master       {time.time() - t0:5.1f} s")

    mix = mix + render_bed() * stop[:, None]
    mix[N - fo:] *= tail
    mix[-sec(0.01):] = 0.0
    mix = np.clip(mix, -1.0, 1.0)
    assert mix.shape == (N, 2)
    print(f"  score: {integrated_lufs(mix):.2f} LUFS, true peak {true_peak_db(mix):.2f} dBTP, "
          f"{len(mix) / SR:.3f} s   ({time.time() - t0:.1f} s)")
    return mix


# ----------------------------------------------------------------------------- SFX
def sfx_tick() -> np.ndarray:            # soft 40 ms click
    n = sec(0.040)
    burst = iir(noise(n) * expdec(n, 0.0008), *biquad("bp", 2500.0, 1.0))
    body = sine(1900.0, n) * expdec(n, 0.004)
    x = lp1(norm(burst) + 0.7 * body, 6000.0)
    return fade(x, 0.0, 0.01)


def sfx_type() -> np.ndarray:            # keyboard tap, 30 ms
    n = sec(0.030)
    tap = iir(noise(n) * expdec(n, 0.002), *biquad("bp", 1600.0, 0.8))
    thock = sine(150.0, n) * expdec(n, 0.008)
    return fade(norm(tap) + 0.8 * thock, 0.0, 0.008)


def sfx_whoosh() -> np.ndarray:          # 0.35 s band-pass noise sweep, low to high
    n = sec(0.35)
    u = tt(n) / (n / SR)
    x = svf(noise(n), np.geomspace(300.0, 7000.0, n), q=1.2, mode="bp")
    env = (u ** 1.5) * ((1.0 - u) ** 0.45)
    return fade(x * env / env.max(), 0.005, 0.02)


def sfx_impact() -> np.ndarray:          # 0.6 s deep 808 boom with a short transient
    n = sec(0.6)
    t = tt(n)
    f = 50.0 + 150.0 * np.exp(-t / 0.03)
    body = sine(f, n) * expdec(n, 0.17) * attack(n, 0.0008)
    body = np.tanh(2.0 * body) / math.tanh(2.0)
    trans = iir(noise(n) * expdec(n, 0.002), *biquad("bp", 2200.0, 1.0))
    return fade(norm(body) + 0.35 * norm(trans), 0.0, 0.06)


def sfx_click() -> np.ndarray:           # UI click, 60 ms
    n = sec(0.060)
    ping = sine(2600.0, n) * expdec(n, 0.004) + 0.5 * sine(5200.0, n) * expdec(n, 0.0015)
    burst = iir(noise(n) * expdec(n, 0.0004), *biquad("hp", 3000.0, 0.7))
    return fade(ping + 0.6 * norm(burst), 0.0, 0.01)


def sfx_riser() -> np.ndarray:           # 1.2 s noise riser plus a rising sine
    n = sec(1.2)
    u = tt(n) / 1.2
    nz = svf(noise(n), np.geomspace(300.0, 8000.0, n), q=0.8, mode="hp") * u ** 2
    tone = sine(np.geomspace(180.0, 1440.0, n), n) * u ** 1.5
    return fade(norm(nz) + 0.5 * tone, 0.01, 0.003)


def sfx_chime() -> np.ndarray:           # 0.5 s bell, two partials
    n = sec(0.5)
    f1 = 1174.66
    x = sine(f1, n) * expdec(n, 0.18) + 0.45 * sine(f1 * 2.756, n) * expdec(n, 0.07)
    return fade(x * attack(n, 0.0005), 0.0, 0.04)


def sfx_flash() -> np.ndarray:           # 80 ms bright noise burst
    n = sec(0.080)
    x = iir(iir(noise(n), *biquad("hp", 4000.0, 0.7)), *biquad("hp", 4000.0, 0.7))
    return fade(x * expdec(n, 0.018), 0.0, 0.015)


SFX = {"tick": sfx_tick, "type": sfx_type, "whoosh": sfx_whoosh, "impact": sfx_impact,
       "click": sfx_click, "riser": sfx_riser, "chime": sfx_chime, "flash": sfx_flash}


def render_sfx() -> None:
    for name, fn in SFX.items():
        x = norm(fn(), db(-6.0))
        write_wav(os.path.join(SFX_DIR, f"{name}.wav"), x)
        print(f"  sfx/{name}.wav  {len(x) / SR * 1000:6.1f} ms  peak {20 * math.log10(np.max(np.abs(x))):.2f} dBFS")


# ----------------------------------------------------------------------------- beat detector
def detect_beats(path: str, n_beats: int = N_BEATS):
    """Find the beat onsets in the rendered score from the audio alone.

    Onset strength = half-wave-rectified rise of a 1 ms RMS envelope of the 3.5-7 kHz band
    (where the per-beat click layer lives). Peaks are picked with a minimum spacing
    of 0.4 s, the n_beats strongest kept, and each onset is refined back to the start of
    its attack (the first sample where the rise exceeds 25 % of the peak rise).
    """
    x, sr = read_wav(path)
    assert sr == SR
    m = x.mean(axis=1)
    y = iir(iir(m, *biquad("hp", 3500.0, 0.707)), *biquad("hp", 3500.0, 0.707))
    y = iir(y, *biquad("lp", 7000.0, 0.707))
    w, lag = sec(0.001), sec(0.0015)
    c = np.cumsum(np.concatenate([[0.0], y * y]))
    env = np.empty(len(y))
    env[w - 1:] = c[w:] - c[:-w]
    env[: w - 1] = c[1:w]
    env = np.sqrt(env / w)
    rise = np.maximum(0.0, env - np.concatenate([np.zeros(lag), env[:-lag]]))

    peaks = np.flatnonzero((rise[1:-1] > rise[:-2]) & (rise[1:-1] >= rise[2:])) + 1
    order = peaks[np.argsort(rise[peaks])[::-1]]
    min_dist = sec(0.4)
    chosen: list[int] = []
    for p in order:
        if all(abs(p - q) >= min_dist for q in chosen):
            chosen.append(int(p))
            if len(chosen) == n_beats:
                break
    chosen.sort()
    onsets = []
    for p in chosen:
        i = p
        thr = 0.25 * rise[p]
        while i > 0 and rise[i - 1] >= thr:
            i -= 1
        onsets.append(i / SR)
    # robustness margin: weakest chosen beat vs the strongest onset at least 60 ms from any beat
    far = np.min(np.abs(peaks[:, None] - np.array(chosen)[None, :]), axis=1) >= sec(0.06)
    competitor = float(rise[peaks[far]].max()) if far.any() else 1e-12
    margin_db = 20 * math.log10(min(float(rise[p]) for p in chosen) / max(competitor, 1e-12))
    return np.array(onsets), margin_db


def write_beats(path_wav: str, path_json: str) -> tuple[float, float]:
    onsets, margin_db = detect_beats(path_wav)
    n = np.arange(len(onsets))
    slope = np.polyfit(n, onsets, 1)[0]
    bpm = 60.0 / slope
    dev_ms = (onsets - n * BEAT) * 1000.0
    beats = [{"n": int(i), "seconds": round(float(s), 4), "frame": int(math.floor(s * FPS + 0.5))}
             for i, s in zip(n, onsets)]
    with open(path_json, "w") as f:
        json.dump({"bpm": round(float(bpm), 3), "fps": FPS, "beats": beats}, f, indent=1)
    print(f"  beats.json: {len(beats)} onsets, bpm {bpm:.3f}, max |dev| {np.max(np.abs(dev_ms)):.2f} ms, "
          f"mean dev {dev_ms.mean():+.2f} ms, weakest beat / strongest non-beat onset {margin_db:+.1f} dB")
    return float(bpm), float(np.max(np.abs(dev_ms)))


# ----------------------------------------------------------------------------- main
def main() -> None:
    os.makedirs(SFX_DIR, exist_ok=True)
    print("score")
    score = render_score()
    score_path = os.path.join(AUDIO_DIR, "score.wav")
    write_wav(score_path, score)
    print("sfx")
    render_sfx()
    print("beats (measured from score.wav)")
    bpm, maxdev = write_beats(score_path, os.path.join(AUDIO_DIR, "beats.json"))
    if maxdev > 15.0:
        raise SystemExit(f"beat grid off by {maxdev:.1f} ms: sharpen the transients")


if __name__ == "__main__":
    main()

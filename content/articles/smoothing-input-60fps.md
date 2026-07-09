# Smoothing input on 60fps mobile

Touch input on mobile is noisier than it looks. Between finger jitter, variable
sample rates, and the odd dropped frame, raw pointer deltas rarely translate into
the buttery movement players expect. This post is my working notes on getting
input to *feel* right at 60fps.

## The problem

A naive controller reads the latest touch position every frame and moves the
player there. That surfaces every bit of sensor noise and every timing hiccup:

- Sample rate isn't locked to your frame rate.
- A single slow frame makes one step look like a teleport.
- Players notice sub-pixel jitter more than you'd think.

## What actually helped

A short list of things that moved the needle, roughly in order of impact:

1. **Timestamped samples**, not per-frame reads — integrate against real dt.
2. **A small smoothing window** (exponential, not a naive average) to kill jitter
   without adding lag.
3. **Clamping** the maximum per-frame delta so a dropped frame can't launch you
   across the screen.

> Rule of thumb: smooth enough to hide noise, never so much that the character
> lags behind the thumb.

*Full writeup — with the actual filter code and before/after clips — coming soon.*

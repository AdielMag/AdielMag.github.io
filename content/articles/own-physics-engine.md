# Why I built my own physics engine

For **ClashUp** I ended up writing my own deterministic physics layer —
*AetherNet* — instead of reaching for an off-the-shelf engine. That sounds like
a classic case of not-invented-here, so here's the reasoning.

## The constraint that changed everything

The game is an authoritative-server multiplayer brawler. Every client has to
simulate the exact same world and arrive at the exact same result, frame for
frame. That one requirement — **determinism** — rules out most physics engines
before you even start.

- Floating-point results differ across devices and compilers.
- Internal iteration order isn't guaranteed to be stable.
- You don't control the tick, so you can't lockstep it with the netcode.

## What "my own" bought me

Rolling it myself meant I could commit to fixed-point math, a fixed timestep, and
a solver whose iteration order I fully control. The payoff is a simulation I can
run on the server and every client and trust to stay in sync.

*Full writeup — fixed-point gotchas, the solver, and how it hooks into rollback —
coming soon.*

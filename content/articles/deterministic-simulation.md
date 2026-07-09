# Deterministic simulation, the hard parts

"Just make it deterministic" is easy to say and surprisingly hard to do. Once you
need every machine to agree on every frame, a lot of comfortable assumptions stop
holding.

## The usual suspects

The bugs almost always trace back to one of these:

- **Floating point.** The same expression can round differently across CPUs and
  compilers. Fixed-point math is the boring, reliable answer.
- **Iteration order.** Hash-map ordering, unstable sorts, and "whatever order the
  entities happened to spawn in" all leak nondeterminism.
- **Time.** Anything driven by wall-clock time instead of the simulation tick will
  drift.

## How I keep it honest

A fixed timestep, a fixed iteration order, and a running checksum of world state
that clients compare every N frames. When the checksums diverge, you know the
*exact* frame it happened on — which turns "it desynced somewhere" into a
debuggable problem.

*Full writeup — the checksum harness and a few war stories — coming soon.*

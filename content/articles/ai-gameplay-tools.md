# Using AI to write gameplay tools

Most of my AI wins haven't been in the game itself — they've been in the
*tooling around it*. Editor scripts, data validators, one-off content generators:
the unglamorous stuff that used to eat afternoons.

## Where it pays off

The sweet spot is well-specified, low-ambiguity work with a fast feedback loop:

- **Editor gizmos** — "draw a handle for this spawn volume" is a five-minute prompt.
- **Data migrations** — reshaping a balancing spreadsheet into game-ready JSON.
- **Boilerplate** — serializers, enum tables, test fixtures.

## Where I stay hands-on

I still write the core simulation and anything determinism-sensitive by hand —
the [physics engine](article.html?slug=own-physics-engine) is not something I'm
going to vibe-code. AI is a force multiplier on the scaffolding, not a substitute
for the parts that have to be exactly right.

*Full writeup — the actual prompts and the tools they produced — coming soon.*

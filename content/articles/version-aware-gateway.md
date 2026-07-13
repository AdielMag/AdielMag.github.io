# The version-aware gateway: shipping without kicking anyone off

Updating a live multiplayer game is scarier than it sounds. The client and the server
have to agree — on the shape of every message, on the rules of the simulation, on what
each byte means. Change the server and suddenly every player still running yesterday's
build is talking to something that no longer understands them.

The usual answers are all a bit grim: a maintenance window that boots everyone off, a
forced update that won't let anyone play until they download the new build, or a
careful blue-green dance of spinning up parallel fleets of machines. For a solo
pre-launch project, I wanted none of that. So **ClashUp** treats a game version as a
disposable container image, and puts a small router in front that speaks every version
at once.

## A version is a container, not a machine

Here's the core move. The server isn't "the server." Each *version* of the game server
is its own container image, tagged with the build it was compiled from — `:1.0.1`,
`:1.0.2`, and so on. In front of them sits one long-lived **gateway**.

Every request a client makes carries its build version in a header. The gateway reads
that header and forwards the request to a backend running *exactly* that version —
spawning one on demand if it isn't already up. Internal server-to-server traffic
arrives with no version header, so it routes to a default (`latest`).

![One gateway reads each client's version header and routes them to a backend container for exactly that version, spawned on demand](assets/img/gateway-router.svg)

The consequence is the quietly powerful bit: **two builds never have to agree on
anything.** A player on 1.0.1 talks to a 1.0.1 backend; a player on 1.0.2 talks to a
1.0.2 backend. They can differ in physics, in rules, in message formats — it doesn't
matter, because they never share a process. The only contract that has to stay stable
is the thin one between the client and the gateway itself.

## Shipping a new version

Because versions are just images, a deploy is almost boring — which is exactly what you
want.

![A release timeline: push 1.0.2 to the registry, old 1.0.1 players keep their warm backend, new players get a 1.0.2 backend spawned side-by-side, the old one idle-evicts after 30 minutes](assets/img/gateway-release.svg)

1. **Push the new image** to the registry. No machines change. Nothing restarts. The
   players already in a match on the old version don't feel a thing.
2. **The first player on the new build connects.** The gateway sees a version it isn't
   running yet and spins up a backend for it, right alongside the old one.
3. **The old version fades out.** As its last players drift away, that backend sits
   idle and evicts itself after about half an hour. No one schedules its death; it just
   tidies up after itself.

There's no maintenance window because nothing goes down. There's no forced update
because the old build keeps working for as long as people are on it. And rollback is a
non-event: if a new build is bad, the players on the old version were never migrated
onto it in the first place — there's nothing to undo.

## What happens to a client that's *too* old

Not every old version can live forever. When a build finally ages out and stops being
served, a client on it doesn't get a cryptic crash — it gets a clean, specific answer.
The gateway replies with a "your version isn't supported, please update" signal (and
even lists which versions *are* live), so the client can show a friendly "time to
update" screen instead of silently failing. Saying *no* clearly is part of the design,
not an afterthought.

## One image, two jobs

There's a smaller trick hiding in here that saves a lot of maintenance. The lobby/
matchmaking side of the game and the in-match game-server side are *the same gateway
image* — they differ only in configuration (which ports, which backend images, whether
to pre-warm). One thing to build, one thing to reason about, one thing that can break,
running in two roles.

## The tradeoffs

This isn't free. The first player to reach a brand-new version pays a small cold-start
while the gateway spins that backend up. And the whole scheme leans hard on that thin
client-to-gateway contract staying stable — the routing layer is the one seam you have
to keep backwards-compatible, forever.

In exchange, a solo developer gets something that normally takes a platform team:
gradual rollouts, coexisting versions, instant rollback, and deploys with no downtime
and no forced updates — all from pushing an image to a registry. For keeping a live
game healthy while you iterate fast, that's a trade I'll take every time.

*More from the ClashUp devlog — the netcode, the physics, the $0-idle fleet — on the
[article list](index.html#articles).*

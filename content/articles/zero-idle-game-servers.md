# Reaching $0 idle cost: serverless-style game servers on GCP

**ClashUp** is a real-time multiplayer brawler. That means real, dedicated servers:
an authoritative game server running the match, and a services tier handling lobbies
and matchmaking. It also means those servers want to run all the time — and right
now, before launch, nobody is playing.

So here's the problem I set out to solve: **a game with zero players should cost
zero dollars to keep online.** Not "cheap." Zero.

![Idle cost broken down into three descending steps: ~$146/mo always-on, ~$25/mo with compute asleep, $0/mo fully asleep](assets/img/zeroidle-cost-ladder.svg)

That's the whole argument in one picture. A naive always-on fleet bills for
everything, 24/7. Putting the machines to sleep gets most of the way there. But the
last stretch — from "cheap" to actually **$0** — is the interesting part, and it's
the part most write-ups skip.

## Why "just autoscale to zero" doesn't exist

The obvious move is to let the autoscaler handle it: no players, no instances. On
Google Cloud, managed instance groups don't work that way. The autoscaler has a
**floor** — it will happily scale *up* under load, but it won't take a group below
one instance. There's always a machine idling, waiting for traffic that isn't
coming.

And even if the machines were free, the fleet leaves a second bill running. A few
networking pieces keep charging whether or not anything is behind them:

- the **entry point** the load balancer exposes to the world,
- the **reserved IP addresses** the fleet hands out,
- the **egress gateway** the servers use to reach the database.

None of those care that the instance count is zero. They bill for simply existing.
So "scale the machines down" caps out at the middle rung of that ladder — cheaper,
but not free.

## The idea: an external brain that *can* scale to zero

If the fleet itself can't reach zero, something outside the fleet has to switch it
off — and that something has to be genuinely free when it's not doing anything.

That's a **serverless controller**: a tiny always-reachable service that scales to
zero on its own, costs effectively nothing at rest, and wakes up only long enough to
flip the rest of the fleet on or off.

![State diagram: a controller flips the fleet between an AWAKE state (instances running, costs money) and an ASLEEP state (scaled to zero, $0/month), triggered by an idle check and by a returning player](assets/img/zeroidle-lifecycle.svg)

The controller only ever makes one of two decisions:

- **Idle for long enough? Put the fleet to sleep.** A scheduled check runs every so often and asks a simple question: has anyone been connected recently? I give it a generous window — a match ending and the next one starting shouldn't ever look like "idle." Only a fleet that's been genuinely empty for a while gets put under.
- **Someone came back? Wake it up.** The moment a real player needs the fleet, the controller brings it back.

Everything else — the whole matchmaking-and-brawling machine — lives on one side of
that switch.

## What "asleep" actually means

Here's the part I think is worth stealing. Most cost-saving stops at "scale the
compute to zero" and calls it a day. That's the middle rung — you're still paying
for all that networking.

To reach true $0, sleeping has to tear down **both**: the compute *and* the
idle-billing networking. And waking has to put both back. So in this system, "asleep"
is a fleet with no instances **and no entry point, no reserved IPs, no egress
gateway** — nothing left that a billing meter can find. "Awake" rebuilds all of it.

Tearing down networking is the unglamorous half nobody talks about, but it's exactly
the half standing between "$25 a month" and "nothing."

[demo:idlecost]

## The one consequence worth calling out

Releasing the reserved IPs has a catch: **the fleet's address is no longer stable.**
Sleep, and it's gone. Wake, and a fresh one gets allocated. So the client can't just
bake a server address into the build.

The fix drops out of the design instead of fighting it. The always-reachable
controller is already the one thing that's guaranteed to be up — so at boot, the
client simply asks it *"where do I connect?"* That request does double duty: it hands
back the current address, and if the fleet happens to be asleep, it wakes it on the
way.

![Architecture diagram: a Unity client asks a serverless Fleet Controller for the connection address; the controller turns the Services and GameServer fleets on and off, builds and tears down the billing networking, and re-allowlists the egress IP with MongoDB Atlas](assets/img/zeroidle-architecture.svg)

That's the shape of the whole thing. The controller is the only public, always-on
piece. It owns the lifecycle — instances on and off, networking up and down — and
because the egress IP is rebuilt on every wake, it also re-introduces the fleet to
the database's allowlist so the servers can reach their data again. The client never
talks to any of that machinery directly; it asks one question and gets an address
back.

## The payoff, and the honest tradeoffs

Idle cost lands where I wanted it: **$0**. When nobody's playing, there is
genuinely nothing running and nothing billing but a serverless endpoint that's also
asleep.

It isn't free of tradeoffs, and I'd rather be straight about them:

- **Waking isn't instant.** The first player back pays a cold start of a couple of minutes while the fleet spins up. For a pre-launch game that's a fine price. For a live one with players arriving around the clock, I'd keep a small "doorman" always on to absorb it.
- **A fully asleep fleet is woken deliberately, not magically.** That's a choice I made for maximum savings while there are no real players to surprise.

None of this makes the game better to play. But it means I can leave a real,
authoritative multiplayer backend deployed indefinitely, through all the quiet weeks
of solo development, without watching a cloud bill tick up for a fleet that nobody is
using. For a solo, pre-launch project, that's exactly the right trade.

*More ClashUp devlog posts — the netcode, the deterministic physics, the tooling —
are on the [article list](index.html#articles).*

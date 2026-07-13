# The dumb client manifesto: zero game logic on the phone

Here's the single decision that shapes everything else about **ClashUp's** netcode:
the phone in your hand is not allowed to decide anything.

It reads your thumb and it draws the world. That's it. It doesn't know the rules,
it doesn't keep score, it doesn't decide who got hit or who won. Every one of those
answers comes from the server. The client is, on purpose, *dumb*.

![The client renders and sends inputs while the server owns the entire simulation as the single source of truth](assets/img/dumbclient-authority.svg)

## Why hand all the power to the server?

Because in a real-time multiplayer game, the alternative is chaos. If two phones
each simulate the fight and disagree — one says the shot connected, the other says it
missed — who's right? The moment the client is *allowed* to be right about anything
that matters, you have two problems that never fully go away:

- **Cheating.** A player who controls the simulation controls the outcome. Anything
  the client decides, a modified client can lie about.
- **Disagreement.** Without one authority, every device drifts into its own slightly
  different version of the match, and you spend forever trying to reconcile them.

So there's exactly one simulation, and it runs on the server. Everyone else is
watching a broadcast of it. That's the whole bet: **one source of truth, and the
phone isn't it.**

## "But doesn't that feel laggy?"

This is the obvious objection. If the phone has to send your input to a server and
wait for the answer before you move, the game feels like it's underwater. Every
demo below is live — drag the sliders and play with them.

The three techniques that fix it come straight from Gabriel Gambetta's classic
[Fast-Paced Multiplayer](https://www.gabrielgambetta.com/client-server-game-architecture.html)
series, which is the reference every netcode implementation quietly leans on.

## Prediction: you, in the present

Watch the problem first. Turn **prediction off** and hold a direction — your
character sits still until a full round-trip later, because only the server is
allowed to move it. Now turn prediction **on**: the phone shows your move the instant
you press, running the same movement the server will, and never waits for permission.

[demo:prediction]

The move you make locally is an educated guess the client is almost always right
about — so it just makes it, immediately.

## Reconciliation: quietly corrected

Prediction leaves a gap: you're now *ahead* of the server, running on moves it hasn't
confirmed yet. Reconciliation closes that gap without you ever noticing.

Every input is numbered. The server processes them and echoes back the last number it
handled. The client throws away the inputs the server has confirmed, then **replays**
the handful still in flight on top of the server's authoritative position. The glowing
queue below is those un-acked inputs — hit "Network spike" and watch it swell, then
drain as the acknowledgements catch up.

[demo:reconciliation]

Acking by input *number* (not by clock time) is the trick that makes this robust:
client and server clocks drift, but a sequence counter the server echoes back is exact,
so precisely the right inputs get replayed — no rubber-banding.

## Interpolation: everyone else, a hair in the past

Your own character you see in the present. Everyone else is different: they're not
simulated on your device at all, just played back from the server's broadcast.

The catch is that the server only sends snapshots a few times a second. Render straight
from them and remote players teleport. So instead the client **buffers** the snapshots
and draws each remote player *between* the two most recent ones — deliberately rendering
them a fraction of a second in the past. Toggle interpolation off to see the raw
snapshots jump; on to see it smoothed.

[demo:interpolation]

That's the mantra the whole design rests on: **see yourself in the present, everyone
else in the past.** Instant response for your own movement, buttery-smooth motion for
everyone else — at the cost of viewing them slightly behind.

## Lag compensation: making the shot count

That "everyone else in the past" trade has a sting. When you line up a shot, you're
aiming at where the enemy *was*, not where they are now. Fire, and by the time your
shot reaches the server they've already moved — so a perfectly aimed shot misses.

Lag compensation fixes it by leaning on the server's authority in reverse: the server
knows exactly what you saw and when, so it **rewinds** the world to the instant you
fired and checks the hit *there*. Turn it off and watch even dead-on shots whiff; turn
it on and your aim is honored.

[demo:lagcomp]

This is the one place the server bends toward the client — it trusts *when* you fired
so it can reward good aim. (The flip side: occasionally you'll get hit a moment after
ducking behind cover, because on the shooter's screen you were still exposed.)

## The discipline this demands

The hard part of a dumb client isn't the clever prediction code — it's the *discipline*
to never cheat on the principle when you're tired and something's broken.

The temptation shows up constantly. A client gets stuck because it missed a message
from the server — say, the signal that the match ended. The lazy fix is a client-side
timeout: "if I haven't heard from the server in three seconds, just end the match
myself." It works in the demo. And it's poison.

The moment the client *synthesizes* an authoritative event, you've broken the
contract — and worse, you've hidden a real server bug behind a plausible-looking guess.
So the rule holds even when it's inconvenient: if the client is stuck waiting on the
server, the fix goes in the *server* (deliver the message reliably, replay it on
reconnect), never in a client that invents the answer.

## Why it's worth the trouble

A dumb client is more work up front — you build prediction, reconciliation,
interpolation, and lag compensation instead of just moving a sprite. What you get back
is a game that's fair by construction, consistent for everyone in the match, and honest
about where its bugs actually live. For a competitive real-time brawler built solo,
that trade isn't close.

The phone is dumb on purpose. That's the point.

*More from the ClashUp devlog — the physics, the tooling, the ops — on the
[article list](index.html#articles).*

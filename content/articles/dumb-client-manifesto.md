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
wait for the answer before you move, the game feels like it's underwater.

It would — if that's how it worked. It isn't. Three tricks close the gap so completely
that a strict server-authoritative game feels instant:

![A timeline showing the local player predicted in the present, reconciliation replaying un-acked inputs, and remote players interpolated 66ms in the past](assets/img/dumbclient-timeline.svg)

- **Prediction — you, right now.** When you move, the phone shows it *immediately*,
  running the same movement the server will. It doesn't wait for permission; it makes
  an educated guess it's almost always right about.
- **Reconciliation — quietly corrected.** The server's real answer arrives a fraction
  of a second later. The client snaps to that truth and instantly re-applies the inputs
  the server hadn't seen yet. If the guess was right (it usually is), you notice
  nothing. If it was wrong, it's fixed before you can tell.
- **Interpolation — everyone else, a hair in the past.** Other players aren't
  simulated on your device at all. They're played back smoothly from the server's
  broadcast, rendered about 66 milliseconds behind. That tiny delay buys perfectly
  smooth motion even when a packet goes missing.

The mantra I keep coming back to: **see yourself in the present, everyone else in the
past.** You get instant response for the one thing you're most sensitive to — your own
movement — and buttery-smooth motion for everyone else.

## The discipline this demands

The hard part of a dumb client isn't the clever prediction code. It's the *discipline*
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

A dumb client is more work up front — you build prediction, reconciliation, and
interpolation instead of just moving a sprite. What you get back is a game that's
fair by construction, consistent for everyone in the match, and honest about where its
bugs actually live. For a competitive real-time brawler built solo, that trade isn't
close.

The phone is dumb on purpose. That's the point.

*More from the ClashUp devlog — the netcode, the physics, the tooling — on the
[article list](index.html#articles).*

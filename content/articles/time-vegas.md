# Time-Vegas: the last 20 seconds of a prediction market are a casino

**MoneyMaker** is my automated trader for Polymarket's crypto resolution markets -
"will BTC close this 15-minute window above where it opened?" The strategy sounds
almost boring: when one side is trading at 95–99¢ and the math says the outcome is
locked in, buy it, wait a few minutes, redeem at $1.00. Collect pennies, repeat all day.

The problem with collecting pennies is that somebody out there has built a machine
for taking them from you, and it operates almost exclusively in the final seconds
before resolution.

## The predatory flip

I watched this happen to my own positions before I understood it. The bot is holding
YES at 97¢ with forty seconds left. BTC is comfortably above the open price. Nothing
about the underlying asset has changed. Then the *token* price dives: 97¢, 91¢, 84¢,
in a couple of ticks. If you have a stop-loss - and with your whole
balance in the position, you'd better - it fires. You sell into the dip at a loss.
Seconds later the market resolves exactly the way it always was going to, and
whoever bought your panic-sold shares collects your dollar.

The tell is right there in the data: **the token price moved while the asset price
didn't.** BTC was flat or even rising, and the market that's supposed to be pricing
BTC's outcome crashed anyway. That divergence isn't information - it's a predator
shaking the tree.

![Two signals watch the final seconds: price-data divergence catches the token dumping while BTC stays flat, and the Time-Vegas kill switch refuses to risk 98 cents to win 2](assets/img/timevegas-signals.svg)

## Two tripwires

The bot's defense is a signal called **Predatory Exit**, and it's two independent
tripwires.

The first is price-data divergence. It fires when the token drops 3¢ or more in a
single tick while BTC is flat or moving *in our favor*. It only arms itself inside
the last 30 seconds, only if the price has already fallen below 88¢, and only if the
market had previously peaked above 93¢ - meaning this was a high-conviction position
that is suddenly, inexplicably collapsing. Every one of those conditions exists to
filter out an honest wobble. A 97¢→94¢→97¢ flutter near the top never trips it.

The second is the Time-Vegas kill switch, which is less a detector than a piece of
philosophy with a config block. With under 20 seconds remaining, if the position is
still trading below 98.5¢, the bot exits. No divergence required. At that point you
are risking ~98¢ of capital to earn the last ~2¢, at the exact moment the market is
most manipulable and your stop-loss has the least time to save you. That's letting
your money sit on a casino table because the dealer hasn't asked for it yet.

## Signals have to pay rent

Both tripwires have thresholds - the window, the drop size, the peak requirement -
and every threshold is a chance to be wrong in a new way. So none of them were
picked by feel. I ran a grid search over **2,592 parameter combinations** against
the bot's own recorded history: 13 real trades that ended in a stop-loss, and 150
that won.

The winning combination catches 9 of the 13 predatory losses, saving $17.14. It
also false-fires on 8 of the 150 winners, costing $3.48 in abandoned profit. Net:
**+$13.66** over that sample, so the signal pays for its own false alarms about
five times over.

Those are small dollar amounts. The bet sizes were small while I proved the system
out. The shape of the result is what matters: a defensive signal is never free, and
the only honest way to keep one is to measure what it saves *minus* what it costs.
That audit has killed prettier ideas than this one; the
[backtest confessions](index.html#articles) post has the body count.

One more thing the code does that I've come to like: the signal ships **disabled
by default**. Every wallet that runs this strategy has to opt in, per bot, in its
settings file. A tripwire that sells your entire position in one tick is exactly
the kind of thing that should never be silently on.

## The part that isn't about prediction markets

Any time an automated system watches one noisy stream as a proxy for a truth it
actually cares about, an adversary can attack the proxy without touching the truth.
Here it's the token price standing in for BTC's price. Elsewhere it's a health
check standing in for a service actually working, or a queue depth standing in for
throughput.

The fix is the same everywhere: watch both streams, and treat *divergence between
them* as its own first-class signal.

*More from the MoneyMaker devlog - the z-score entry gate and the stop-losses that
audit the orderbook - on the [article list](index.html#articles).*

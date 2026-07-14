# Stop-losses that don't trust the price

A stop-loss is supposed to be the safety net: if the position drops below a
threshold, sell, cap the damage, live to trade again. Every trading tutorial
treats the trigger price as ground truth. My Polymarket bot learned the hard way
that on a thin market, **the price is just a number someone chose to show you.**

## The $2 attack on a $100 position

Here's the manipulation pattern, reconstructed from the bot's own tick recordings.
The bot holds NO, trading happily at 99¢. An attacker places one tiny sell order —
a couple of dollars' worth — at 45¢. On a thin orderbook that single order *is*
now the market: the quoted price craters through the bot's 60¢ stop-loss
threshold. The bot does what stop-losses do: it panic-sells into a book with
almost no real bids, taking a catastrophic fill. The attacker buys the cheap
shares, cancels their order, and the price snaps right back to 99¢. Total cost of
the attack: a few dollars of bait. Total take: my position.

The stop-loss didn't fail. It executed perfectly. That's the problem — it
faithfully protected me from a threat that didn't exist, and handed my shares to
the person who invented it.

![A fake dip: one thin sell order drags the quoted price through the stop threshold while the real bids never moved — the depth check catches it](assets/img/stoploss-depth.svg)

## A price without depth behind it is an opinion

The fix ships in the bot as a pre-flight check on every stop-loss trigger. Before
selling a single share, it fetches the live CLOB orderbook for the token it holds
and asks two questions.

**Is there real money underneath this price?** It sums every bid within 10¢ of
the current price. If the total is under a configurable floor — $15 by default —
the "crash" has no substance. Nobody is actually offering to buy at these panic
prices in any size, which means the quoted drop is likely one synthetic order.
The bot skips the sell and re-checks next tick.

**Where is the best bid?** This is the sharper tell. If the token "dropped" to
58¢ but the highest bid in the book is still sitting at 97¢, the price move came
entirely from the *ask* side — someone dangling a low offer. Real sellers fleeing
a genuinely dying position hit the bids and drag them down. Bids that never moved
mean the fear is fake.

If the drop passes both checks — real depth, bids genuinely collapsed — the
stop-loss fires exactly as before. A genuine flip still gets cut fast. The check
only filters the theater.

[demo:depthcheck]

## Failing open, deliberately

There's one design decision in this code I went back and forth on. What happens
when the orderbook fetch itself fails — API timeout, rate limit, network blip?

The bot **fails open: it allows the sell.** That feels backwards for a
manipulation defense, but the alternative is worse. If a dead API blocked the
stop-loss, then any outage — or any attacker who can *induce* an outage — would
leave the position completely unprotected during a real crash. A rare bad sell on
a fake dip costs one trade. A stop-loss that silently stops existing can cost the
whole balance. When a safety system degrades, it should degrade toward the mode
whose worst case is smaller.

## The rest of the armor

The depth check is one layer of a stack, because the final minutes of these
markets are adversarial from every direction. The stop-loss itself is **tiered**
(sell 25% at one threshold, more at the next, everything at the last) so a
borderline dip doesn't dump the whole position. It refuses to fire in the final
seconds before expiry, where the exchange rejects orders anyway and a failed
sell just burns the retry budget. And the position size it protects is re-synced
from the on-chain positions API every tick, so after a partial fill it always
sells what actually remains rather than what it remembers buying.

None of this made the bot smarter about *entering* trades. It made the bot harder
to lie to — which, in a market where the lying is automated too, turned out to be
worth more.

*More from the MoneyMaker devlog — the Time-Vegas kill switch, the z-score entry
gate, the backtest confessions — on the [article list](index.html#articles).*

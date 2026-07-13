# Everything my backtests told me that I didn't want to hear

My Polymarket bot has an unusual data advantage: it records everything it sees.
Every tick of every market — asset price, YES/NO prices, volatility — streams
into cloud storage as gzipped JSONL, with a small metadata file per market so
listings stay fast. Six *observer* bots with unfunded wallets sit on market
types I don't trade yet (SOL 5-minute, ETH 15-minute, and so on), accumulating
history for free. The dashboard can replay any past market on the live chart
like game film.

Which means every strategy idea faces the same tribunal: a sweep script loads
hundreds of real recorded markets and replays the exact entry, stop-loss, and
exit logic over each one, for thousands of parameter combinations. Here is what
the tribunal kept ruling, and how consistently the rulings insulted my
intuition.

## Confession 1: the "safest" prices lose money

The strategy buys near-certain outcomes late in the window, so naturally I
believed *more certain is better* — a 97¢ entry beats an 88¢ entry. The replay
data said the opposite: **entries above 85¢ were negative expected value.**

The arithmetic is brutal once you see it. Buy at 97¢ and your upside is 3¢; a
single stop-loss exit around 75¢ costs 22¢ — one bad market erases seven
winners. Worse, the cheap-looking losses cluster exactly there, because
manipulation targets high-conviction markets (shaking out 97¢ holders is where
the money is). Certainty at a certain price isn't safety; it's paying full
price for upside that no longer covers the tail. The finding is now code — a
`maxBuyPrice` filter that skips entries above 85¢ — and it exists purely
because the replays kept saying so.

## Confession 2: one strategy is secretly several

Same assets, same exchange, same code. The sweeps tuned 15-minute markets to
`buy ≥ 0.97, z ≥ 2.0` with a single tight stop — and 5-minute markets to
`buy ≥ 0.84, z ≥ 0` with a two-tier stop-loss. Not slightly different:
*opposite philosophies*. The 15-minute edge is patient sniping; the 5-minute
edge is earlier, cheaper entries where there's no time for the market to fully
converge — or to be manipulated. I'd assumed a timeframe was a parameter. It's
a regime. Every market/timeframe pair now carries its own settings file, tuned
against its own recordings, because "the strategy" turned out to be a family.

![The replay tribunal: recorded markets stream out of cloud storage, thousands of parameter combos re-fight each one, and the intuition loses](assets/img/backtest-tribunal.svg)

## Confession 3: a perfectly calm market is a broken feed

Sweeping for what separated winning entries from losing ones surfaced a filter
I'd never have invented: **skip the trade when measured volatility is almost
exactly zero.** Zero volatility looks like the safest possible setup — nothing
is moving, the lead can't be threatened. In the recordings, it flagged
something else entirely: a stale price feed. Nothing was moving because the
*data* wasn't moving, and the "safe" entry was priced on a snapshot of the
past. Suspiciously good input is a failure mode, not a gift. That's a lesson
worth exporting far beyond trading.

## Confession 4: defensive features must pay rent in dollars

The manipulation-exit signal I was proudest of — it detects the token price
diving while the asset stays flat in the final seconds — went to the tribunal
like everything else: a grid search over 2,592 parameter combinations against
13 real stop-loss trades and 150 real wins. Verdict: catches 9 of 13 disasters
(+$17.14), false-fires on 8 of 150 winners (−$3.48), net **+$13.66**. It
stayed. An earlier, cleverer orderbook index faced the same audit as an entry
gate and lost to a one-line z-score. It was demoted. The rule the sweeps
enforce is cold: elegance is not a metric. Saved-minus-cost is the metric.

## Confession 5: my accounting flattered me

The replays also audited the scorekeeper. The performance panel originally
divided total profit by total capital deployed — which double-counts when
every win is immediately reinvested, quietly inflating the return. It also
computed win rate over trades *entered*, letting the bot look brilliant by
simply never trading. Both got fixed: per-trade returns summed individually,
and a `MARKET_SEEN` record logged for every market evaluated and declined, so
the denominator includes the trades that didn't happen. A backtest pipeline
that only audits the strategy and never audits the scoreboard has an obvious
blind spot — the scoreboard is written by the party with the most motive.

## The moral

None of these five findings came from thinking harder. I *had* thought hard,
and thought wrong, about every one of them. They came from recording reality
cheaply and replaying it mercilessly. If you automate anything: build the
flight recorder before you build the autopilot, and when the replay contradicts
your intuition, update the intuition. It has the losses memorized. You don't.

*More from the MoneyMaker devlog — the z-score gate, the last-20-seconds
casino, the dollar-sign bug — on the [article list](index.html#articles).*

# How hard is this market to shove? Scoring manipulation resistance 0–100

Every quant blog post is about the same question: *what will the price do next?*
This one is about a different question that I've almost never seen written up:
**how expensive would it be, right now, for someone to make the price lie?**

My Polymarket bot bets that BTC's spot price will stay on one side of a strike
for a few more minutes. The bet's real enemy isn't volatility — the entry math
already prices that in. The enemy is that the resolution source is *itself a
market*, and markets can be pushed. If BTC's orderbook is thin enough, a whale
can shove the spot price across the strike at the exact moment it matters,
flip the outcome, and collect from everyone on the other side. Before risking a
balance on "the price will hold," it's worth asking how firmly the price is
actually held.

The bot's answer is the **Manipulation Resistance Index** — a live 0–100 score
composed from four microstructure measurements, each one estimating the cost of
a different way to lie.

## Four ways to push a market

**1. Depth-to-Volatility Resilience (DVR).** The blunt-force question: how much
real volume sits within ±1% of the mid price, relative to how fast the price is
currently moving? Deep book in a calm market — a shove costs millions. Thin book
in a fast market — a shove is pocket change. This is the workhorse, weighted
40% in normal conditions.

**2. Weighted Orderbook Imbalance (OBI).** A balanced book resists pressure
from both directions; a lopsided one is pre-tipped, waiting for a push it can't
absorb. The bot weights the top ten levels by `1/L` decay — the levels nearest
the mid matter most — and scores balance high, imbalance low.

**3. Kyle's lambda — the price of impact.** The most classically "quant" of the
four: regress price change against signed volume over the last hundred trades,
and the slope λ tells you how many dollars of price movement one dollar of
aggressive flow buys. It's the literal exchange rate of manipulation. High
lambda means the market is fragile *in practice*, whatever the book looks like.

**4. Quote persistence.** The spoofing detector. Track every price level that
vanished from the book in the last five minutes and ask: did it disappear
because it *traded*, or because it was *cancelled*? A book full of orders that
evaporate untouched is scenery, not liquidity — depth that will not be there
when it's needed. Real markets have quotes that stay and fill.

![Four microstructure measurements — depth vs volatility, book balance, price impact, quote persistence — blend into one 0–100 resistance score, with weights that shift by regime](assets/img/mri-composite.svg)

## The weights change when the weather does

The part of this design I'm proudest of: the four components don't blend with
fixed weights. The calculator first detects the volatility regime, and the
blend shifts with it.

In a **calm regime**, standing depth is king (DVR 40%) — the book you can see
is the defense you'll get. In a **volatile regime**, the weights flip: Kyle's
lambda jumps from 20% to 40%, because when the market is already moving, the
measured cost of pushing it is the truth, and a snapshot of resting depth is
stale the moment you read it. Same signals, different judge, depending on
conditions. A single fixed formula would be tuned for exactly one kind of day.

## The honest epilogue

Here's the part a tidier blog post would omit: the MRI is no longer the bot's
primary entry gate. It ran that job for a full major version, and it worked —
but a simpler signal (the z-score of the asset's lead over its expected
remaining move) turned out to filter almost the same bad entries with a fraction
of the machinery, and machinery you don't need is machinery that breaks. The
composite still runs, but the flagship overlay on the dashboard is the simpler
signal's violet line.

I don't consider it wasted. Building the MRI is what taught me to *think* in
manipulation cost, and that mindset produced the defenses that did stay
load-bearing: the stop-loss that audits orderbook depth before believing a
price, and the divergence tripwires in the final seconds. The index was
scaffolding. The building stood after it came down.

If you're automating anything against a thin market, the reusable idea is this:
your confidence in an outcome and your opponent's cost to *change* that outcome
are different numbers. Most systems obsessively compute the first and never ask
the second. The second one is computable — depth, balance, impact, persistence
— and when it's low, it doesn't matter how right you are.

*More from the MoneyMaker devlog — the z-score that replaced this index, the
depth-checked stop-losses, the last-20-seconds casino — on the
[article list](index.html#articles).*

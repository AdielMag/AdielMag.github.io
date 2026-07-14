# When 95¢ is cheap: pricing near-certainty with a z-score

Polymarket runs crypto resolution markets on a loop: *will BTC close this
15-minute window above where it opened?* YES and NO tokens trade between 0 and
$1, the winner redeems for exactly $1, and a new market starts every quarter
hour, all day, forever.

Late in a window, when BTC is sitting well above the open, YES trades at 95–99¢.
Buying at 97¢ to collect $1.00 a few minutes later is a 3% return in minutes —
*if* you're right. The entire strategy of my bot, **MoneyMaker**, reduces to one
question asked over and over: the market says 97%. Is the real number higher?

That question has a wonderful property: unlike almost everything else in
trading, it's answerable with math a physics undergrad would recognize.

## The market prices the token. I price the asset.

The token's price is a crowd's opinion. But the event it resolves on is purely
mechanical: BTC's spot price versus a fixed strike, at a fixed time. So instead
of modeling the crowd, model the asset. Over minutes, BTC's price is a decent
random walk, and a random walk's expected wander in the remaining time `T` is
`σ√T`, where σ is its current volatility. That gives a natural yardstick:

```
z = lead / (σ√T)

lead = how far BTC is past the strike, in dollars
σ√T  = how far normal volatility could move it
       in the time remaining
```

The z-score is the distance to disaster measured in units of plausible movement,
and it converts straight into probability: `z = 1.64` means ~95% the outcome
holds, `2.0` means ~97.7%, `3.0` is near certainty.

That conversion is what turns a price into a verdict. If YES trades at 95¢, the
market is implicitly claiming `z ≈ 1.64`. When my measured z is 2.0 or higher,
the market is *underpricing* certainty — those last few cents are being sold too
cheap, and the bot buys them. The entry gate is exactly that: **enter only when
measured z ≥ 2.0 while the price still implies ~1.64.** The edge isn't secret
information; it's that the crowd prices round numbers and vibes, and a √T is
sitting right there unused.

![The Resolution Safety Score: BTC's lead over the strike, divided by the volatility cone that could still close the gap in the remaining time](assets/img/rss-zscore.svg)

[demo:zscore]

## The five lines of theory need fifty lines of armor

Everything above fits on an index card. What made it *tradeable* was defending
each variable from real-world data quality, and each defense earned its place by
failing without it.

**σ is measured, not assumed** — the realized volatility of the last 90 seconds
of ticks, each price move scaled by `√Δt` so irregular tick spacing doesn't bias
it. One flash wick would poison the estimate, so moves beyond 5× the RMS get
winsorized out before the final figure. And the result is clamped into bounds
that scale with the asset's price — never zero, never absurd.

**The lead is smoothed.** The current price runs through an EMA before the lead
is computed, because a single stale or noisy tick at exactly the wrong moment
could spike z past the gate and buy the whole balance. No single tick is allowed
to make that decision alone.

**Time gets a floor.** `√T` with seconds-to-zero explodes the z-score just
before resolution — mathematically true, practically the most dangerous moment
to trust it. The remaining time never counts below one second, and separate
guards stop entries in the final half-minute anyway.

**Cheap certainty has to age.** Alongside z, the signal tracks how long the
price has already held above the entry threshold. A 97¢ that's three seconds
old gets its score halved; one that's held for fifteen gets trusted. Freshness
is suspicion.

## A model as a gate, not an oracle

On the dashboard all of this collapses into one violet line — the Resolution
Safety Score, 0–100 — drawn over the live BTC chart. It actually *replaced* two
earlier overlays from a more complicated era of the bot: an orderbook
manipulation index and an "edge" estimate. Both were smarter on paper. Neither
survived contact with the recorded data as cleanly as lead-over-expected-move.

The philosophical choice that made this work: the model never *finds* trades,
it only **vetoes** them. The market proposes — a price crosses 97¢ — and the
z-score disposes. Used that way, a crude model's errors mostly cost you missed
trades instead of lost money. The random walk is wrong about BTC in a dozen
well-documented ways, and it doesn't matter, because it's only ever asked one
modest question: is normal volatility big enough to flip this outcome in the
next few minutes? For that question, at this timescale, √T is enough.

*More from the MoneyMaker devlog — the last-20-seconds casino, the SOL bug that
was a dollar sign, the backtest confessions — on the
[article list](index.html#articles).*

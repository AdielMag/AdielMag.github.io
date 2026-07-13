# My bot couldn't trade SOL, and the bug was a dollar sign

Version 3.2 of my Polymarket bot was supposed to be a victory lap. The engine had
been profitably trading BTC 15-minute resolution markets for weeks, and the
changes to make it multi-asset were honestly pleasant: the hardcoded `BtcFeed`
became a `CryptoFeed` that takes any Coinbase product ID, the market fetcher
started deriving its API slug from settings, and a config block chose the asset
and timeframe. Six new observer containers came up — BTC, SOL, ETH on 5-minute
and 15-minute markets — dashboards green, charts streaming, ticks recording.

The SOL bot then proceeded to make zero trades. Not "a few bad trades." Zero.
For days. No errors, no rejections, nothing in the logs but calm, patient
evaluation. It looked exactly like a disciplined trader waiting for its moment.

## The gate that could never open

The bot's entry decision hangs on a z-score: how far the asset has moved from
the window's open price, measured in units of expected volatility. The formula is
`z = lead / (σ√T)` — and σ, the volatility estimate, is computed live from the
last 90 seconds of ticks. Live estimates from sparse ticks get noisy, so the code
clamped σ into a sane range:

```
// Sane bounds for per-√second volatility
const SIGMA_FLOOR = 5;    // $ per √s
const SIGMA_CAP   = 200;  // $ per √s
```

Five dollars to two hundred dollars per root-second. Perfectly calibrated bounds
— **for Bitcoin at $80,000.** A $5 floor is about 0.006% of BTC's price: a
sensible "volatility is never truly zero" backstop.

Now run the same clamp for Solana at $100. The floor says SOL's volatility can
never be estimated below $5 per √second — **5% of the entire asset price**, per
root-second. The real figure is closer to half a cent. The clamp inflated SOL's
volatility a thousandfold, which inflated the expected move, which crushed the
z-score toward zero. The entry gate required `z ≥ 2.0`; with that floor, SOL
would have needed to move several percent inside a 15-minute window — while BTC
needed a routine drift. The gate wasn't strict. It was **mathematically
impossible to pass.**

![The same $5 volatility floor is a rounding error at BTC's scale and a wall at SOL's — the fix makes the bounds a percentage of price](assets/img/sigma-scale-bug.svg)

## The fix is one idea: constants must scale

The repair replaces absolute dollars with fractions of the asset's own price:

```
const SIGMA_FLOOR_PCT = 0.00006;  // ~$5 at BTC $80k
const SIGMA_CAP_PCT   = 0.003;    // ~$240 at BTC $80k
const sigmaFloor = openAssetPrice * SIGMA_FLOOR_PCT;
const sigmaCap   = openAssetPrice * SIGMA_CAP_PCT;
```

At BTC's price the new bounds land exactly where the old hand-tuned dollars did,
so the profitable production bot's behavior didn't change at all. At SOL's price
the floor becomes $0.006 per √second — and the SOL bot started trading within
the hour.

## Why this bug was invisible

What stays with me isn't the fix, it's how the failure *presented*. Three things
conspired to hide it.

**A gate that never opens looks like caution.** If the bug had inverted a
comparison and made the bot trade constantly, I'd have caught it in minutes.
A too-conservative bot produces no losses, no errors, and no evidence — just an
absence of trades that's indistinguishable from "the market hasn't offered an
edge yet." The eventual tell was statistical, not visual: days of markets where
the dashboard showed obviously-safe situations the bot kept declining.

**The constants didn't look like BTC code.** The feed was generic, the market
fetch was generic, every function signature said "asset." The BTC assumption
survived in the one place refactors don't reach: two numeric literals whose
*units* — dollars, not percent — encoded the asset they were tuned on. A number
with a unit is an assumption wearing camouflage.

**Every test was a BTC test.** Weeks of profitable production on BTC validated
the exact configuration in which the bug was harmless. Generalizing a system
means your entire testing history suddenly covers only one point of the new
input space.

There's even a small monument to this in the codebase: the tick history field is
still called `btcPrice`, faithfully carrying SOL and ETH prices, with a comment
confessing the name is legacy. I renamed the behavior and kept the name — the
data files already existed, and a misleading name with a loud comment beats a
migration that could corrupt weeks of recorded history. Sometimes you fix the
dollar sign and leave the tombstone.

*More from the MoneyMaker devlog — the z-score gate itself, the manipulation
armor, the backtest confessions — on the [article list](index.html#articles).*

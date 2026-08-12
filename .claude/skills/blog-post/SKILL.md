---
name: blog-post
description: Write, edit, or publish a devlog article on this blog so it matches the existing corpus in voice, structure, art, and metadata. Trigger when asked to write a blog post, add an article, draft a devlog entry, publish a post, edit or improve an existing article, or when touching content/articles/*.md or assets/js/articles.js.
---

# Writing a devlog post

This blog is a zero-dependency static site.
Articles are Markdown files rendered in the browser by a tiny custom renderer, listed from a hand-maintained manifest, and mirrored into static pages by a build script.
Consistency here is not a style preference: the manifest, the renderer, and the generator each have real constraints, and a post that ignores them renders wrong or never appears.

Read one existing article end to end before writing.
`content/articles/version-aware-gateway.md` is the cleanest reference for structure; `content/articles/dumb-client-manifesto.md` is the reference for a post with interactive demos.

## The pipeline (all four steps, or the post is broken)

1. **`content/articles/<slug>.md`** - the prose. Starts with a single `# Title` line.
2. **`assets/js/articles.js`** - add a manifest entry with a matching `slug`. Without it the post does not exist to the site.
3. **`assets/img/splash-<slug>.jpg`** - the hero image, referenced from the manifest as `hero`.
4. **`node tools/build-posts.mjs`** - regenerates `posts/<slug>.html`, `feed.xml`, and `sitemap.xml`. Commit the generated output.

Skipping step 4 means shared links unfurl with no preview and RSS silently omits the post.
Social scrapers do not run JS, so the generated static page is what the outside world sees.

The generator **pre-renders the Markdown body into the page**, so `posts/<slug>.html` contains the full article text rather than an empty `<div>` waiting on `fetch()`.
It also derives two things from the post automatically, with no manifest field to keep in sync:

- **Which demo scripts to load.** It scans the Markdown for `[demo:<id>]` and the demo sources for `window.ArticleDemos.<id> =`, and emits only the files that post actually uses. An unregistered id prints a build warning.
- **Reading time**, counted over prose with code fences and demo markers stripped.

A `[demo:<id>]` paragraph becomes `<div class="demo-mount" data-demo="<id>">` in the generated page, with a one-line fallback inside for readers without JS.
`assets/js/article.js` mounts into those, and still handles the raw `[demo:<id>]` paragraph on the `article.html?slug=` route.

## Voice

Adiel's voice on this blog is specific and easy to break.

- **First person, past tense, real decisions.** Every post is something actually built and its consequences. No tutorials, no "you should", no generic advice.
- **Open with the problem, not the solution.** The first two paragraphs state what was hard and why the obvious answers are unsatisfying. The solution arrives at the first `## `.
- **Concrete over abstract.** Real numbers, real thresholds, real dollar amounts, real version tags. "About half an hour" beats "eventually". "A $2 order" beats "a small order".
- **Name the tradeoff.** Near the end, a section that says plainly what this costs. Posts that only report wins read as marketing.
- **Dry, understated humor.** "A deploy is almost boring - which is exactly what you want." Never hype, never exclamation marks.
- **Short paragraphs.** Three to five sentences. Break before every shift in idea.
- **Bold sparingly**, for the one load-bearing phrase in a section. Italics for asides and emphasis inside a sentence.

Write in plain English.
Avoid buzzwords, avoid "leverage" as a verb, avoid "in today's world" openings.

### The rhetorical tics that make a post read as generated

The corpus was audited for AI-writing tells in August 2026.
Vocabulary came back clean - no "delve", no "landscape", no hedging, no formulaic transitions.
The problem was a set of repeated *moves*, and they are easy to fall back into because each one feels like good writing in isolation.

**Epigrams.** Every section used to end on a short abstract sentence that generalised the technical point above it, averaging 4.4 per post.
Budget one or two per post, and let most sections stop on the technical point.
An epigram earns its place when it carries information the paragraph didn't; it doesn't when it restates the paragraph in a more quotable shape.

**Verdict endings.** Three separate posts closed with a variant of "for a solo project, that's the right trade".
Don't end on a judgement about whether the work was worth it.
End on a specific fact, an unresolved consequence, or the thing you'll have to revisit.

**Self-flattery.** "The part most write-ups skip", "a question I've almost never seen written up", "the unglamorous half nobody talks about".
Seven of these across the corpus.
Say the thing; don't claim it's rare.

**"X isn't A, it's B."** Thirteen instances corpus-wide, twice in some posts.
Once per post is a rhetorical device. Three times is a crutch.

**Bolded inline-header lists** (`- **Thing.** explanation`).
Eight of eleven posts had one, and six announced the count first ("pays off three ways at once", "three things conspired").
At most one such list per post, and never announce how many items are coming - if the third item is padding, cut to two.

**"Here's the..."** as the opener that introduces the core idea. Nine hits across seven posts. Vary it.

**Sentence rhythm.** Every post should contain sentences of six words or fewer; one post had none in 693 words.
Aim for 10-20% of sentences under seven words, and a mean around 15-19.

Counting beats impressions here, so the counter ships with the repo:

```bash
node tools/audit-prose.mjs                 # whole corpus
node tools/audit-prose.mjs <slug>          # one post
```

It prints words, em dashes, spaced dashes per 100 words, bold spans, short-sentence
percentage, mean sentence length, and counts for the four tics above, marking anything
outside budget with a `!`. The budgets live at the top of that file.

### Dashes

Use a plain dash `-` with spaces around it, never an em dash.
This is a standing global rule from Adiel, and the whole corpus was swept to match it.
Keep it that way: an em dash anywhere in prose is a regression.

Two mechanical hazards if you ever sweep dashes again.
A line that begins with an em dash becomes `- ` and the renderer parses it as a list item, so move that dash to the end of the previous line instead.
And leave the `'—'` glyph in `quant-demos.js` alone; it marks "no value" in a canvas readout, where a plain dash reads as a minus sign.

En dashes in numeric ranges (`0–100`, `95–99¢`) are correct typography and stay.

**Budget the spaced dash.**
The em dash count is zero, but ` - ` was doing the em dash's job at roughly one every 55 words, sometimes twice in a sentence.
The corpus now sits near one every 110 words.
Keep it there: when a third dash wants into a paragraph, it's a comma, a colon, or a full stop.

## Structure

Target **700-1200 words**.
Under 700 the post feels like a note; over 1300 it stops getting read.

Use **3-6 `## ` sections**.
No `### ` unless a section genuinely needs sub-parts, which is rare here.

Section headings are statements or questions, not labels.
Good: "A version is a container, not a machine", "What happens to a client that's *too* old".
Bad: "Architecture", "Implementation", "Conclusion".

Vary the **closing-section heading**.
"Was it worth it", "The payoff, and the honest tradeoffs", "Why it's worth the trouble", "The moral", "What generalizes" - five of eleven posts used that shape before the sweep.

The **closing line** is an italic pointer back to the article list, naming two or three sibling posts by topic:

```markdown
*More from the ClashUp devlog - the netcode, the physics, the tooling - on the
[article list](index.html#articles).*
```

Use "the ClashUp devlog" for game-tech posts, "the MoneyMaker devlog" for trading-bot posts, and plain "More devlog" for standalone tooling posts.
Name two siblings, not always three - eleven identical three-item lists read as generated.
If the post ships something public, put a repo or store link in the paragraph directly above that closing line.

## Markdown: what the renderer actually supports

`assets/js/markdown.js` is a hand-rolled renderer, not CommonMark.
It supports headings, paragraphs, `**bold**`, `*italic*`, `` `code` ``, fenced code blocks, ordered and unordered lists, links, images, blockquotes, and horizontal rules.

It does **not** support:

- Tables. Use a list or a diagram instead.
- Nested lists. Indented list items flatten into one level.
- Raw HTML. It is escaped and shows as literal text.
- Reference-style links, footnotes, or strikethrough.
- Hard line breaks inside a paragraph. Consecutive lines are joined with a space, so wrap prose freely.
- Nested emphasis. `**bold with *italic* inside**` will not parse; the bold regex stops at the first `*`.

Fenced code blocks get no syntax highlighting.
Keep them short and language-agnostic, and prefer describing behavior in prose over pasting a large listing.

## Images and diagrams

Two kinds, and they are used differently.

**The hero** is one photorealistic or key-art JPEG at `assets/img/splash-<slug>.jpg`, wired through the manifest's `hero` field.
It never appears in the Markdown body.
Generate it with the `higgsfield-generate` skill, keeping the style consistent with the existing `splash-*.jpg` set.

**In-body diagrams** are hand-written SVGs at `assets/img/<topic>-<aspect>.svg`, embedded with standard Markdown image syntax:

```markdown
![One gateway reads each client's version header and routes them to a backend container for exactly that version, spawned on demand](assets/img/gateway-router.svg)
```

The alt text is a full sentence explaining what the diagram shows, not a label.
It does three jobs: the screen-reader description, the lightbox caption, and - since August 2026 - the **visible caption printed under the figure**.
Write it as a sentence a sighted reader will read, because they now do.

Place a diagram immediately after the paragraph that motivates it.
A post with more than three body diagrams is usually a post that should be two posts.

## Interactive demos

A paragraph containing exactly `[demo:<id>]` and nothing else is replaced at runtime by an interactive widget.

```markdown
[demo:prediction]
```

The id must be **lowercase letters only** - no digits, no hyphens.
The regex is `/^\[demo:([a-z]+)\]$/`, and an id that misses it leaves the literal text in the rendered post.

The id must be registered on `window.ArticleDemos` by a script the article page loads.
Demos are built on `window.DemoKit` (`assets/js/demo-kit.js`), which provides `slider`, `toggle`, `holdButton`, `tapButton`, `frame`, `stage`, `controls`, `caption`, `loop`, and canvas drawing helpers.

Add new demos to the existing topic file (`netcode-demos.js`, `quant-demos.js`) when they fit.
A new topic file must be added to the `<script>` list in **both** `article.html` and the template in `tools/build-posts.mjs`, or the demo will work in dev and vanish in the generated pages.

Introduce every demo in the sentence before it, telling the reader what to do with it: "the demo below is live - drag the sliders and play with them".
A demo the reader does not know is interactive is a static picture.

## The manifest entry

Add to `window.ARTICLES` in `assets/js/articles.js`.
Newest posts go at the end of the array.

```js
{
  slug: 'version-aware-gateway',
  tag: 'Server',
  tagColor: '#ffd23f',
  tagBg: 'rgba(255,210,63,0.14)',
  accent: 'gold',
  title: 'The version-aware gateway: shipping without kicking anyone off',
  excerpt: 'Updating a live multiplayer game usually means downtime or a forced update. How treating each game version as a container behind one router lets old and new builds run side-by-side.',
  hero: 'assets/img/splash-version-aware-gateway.jpg',
  date: 'Jul 13, 2026',
  dateISO: '2026-07-13',
  status: 'published',
}
```

**Tag palette.** Pick one; the three color fields must match it exactly.

| Tag | accent | tagColor | tagBg |
|---|---|---|---|
| Client | `coral` | `#ff6b4a` | `rgba(255,107,74,0.14)` |
| Server | `gold` | `#ffd23f` | `rgba(255,210,63,0.14)` |
| AI | `green` | `#7cf29c` | `rgba(124,242,156,0.14)` |
| Engine | `muted` | `#c9c2d6` | `rgba(201,194,214,0.14)` |
| Trading | `violet` | `#a78bfa` | `rgba(167,139,250,0.14)` |
| Quant | `blue` | `#6cb6ff` | `rgba(108,182,255,0.14)` |

Trading is live-market behavior and defenses; Quant is models, math, and backtests.
Introducing a seventh tag means updating the palette comment in `articles.js` and the tag styles in `assets/css/styles.css` too.

**Slug** is kebab-case, matches the Markdown filename and the hero filename, and never changes after publish.
Changing it breaks the post URL, its RSS entry, and its Giscus comment thread, which is keyed by slug.

**Title** is the same string as the `# Title` line in the Markdown, character for character.

**Excerpt** is one or two sentences, roughly 140-200 characters.
It is the card subtitle, the `<meta name="description">`, the Open Graph description, and the RSS description, so it must stand alone with no context.
Write it as a hook plus a "how" clause: what was hard, then what the post shows.

**date** and **dateISO** must describe the same day.
`date` is `MMM D, YYYY`; `dateISO` is `YYYY-MM-DD`.

**status** is `'draft'` while writing (the card shows a placeholder) and `'published'` when ready.
Only published posts reach `posts/`, the feed, and the sitemap.

## The page these posts land on

Two things about the article page are worth knowing while writing.

**The post's tag colour is the page's accent.** `tagColor` is emitted as `--accent` on `<html>` by the generator, and it drives the rules above `##` headings, body links, the hero's top border, the figure-caption bar, the focus ring, and text selection.
Picking the tag picks the palette of the whole page, so pick it for the content, not the colour.

**Type is a three-face system.** Bricolage Grotesque for titles and `##` headings, Space Grotesk for body, JetBrains Mono for labels and code.
Sizes come from the `--text-*` scale in `assets/css/styles.css`; don't add a raw `px` font size.

## Before you call it done

- `node tools/build-posts.mjs` ran, and `posts/<slug>.html`, `feed.xml`, `sitemap.xml` are staged.
- Serve locally (`python -m http.server 8000`) and open the post. The article page fetches Markdown, so `file://` will not work.
- Check the landing-page card, the hero image, the reading time, every diagram, and every demo.
- Confirm no literal `[demo:...]` text and no escaped HTML is visible in the rendered body.
- Check it at a narrow viewport, down to 320px. Nothing should scroll horizontally.
- Tab through the post without a mouse. Every stop shows a focus ring; the diagrams open with Enter; any demo is drivable from the keyboard.
- Re-read the post once for em dashes that crept in.
- Count the tics: spaced dashes (roughly one per 110 words), bold spans (single digits), sentences under seven words (at least a few), and section-ending epigrams (one or two, not one per section).

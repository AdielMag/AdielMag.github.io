# devlog. — Game Dev Blog

A personal game-development blog for Adiel Magenheim. Static site (plain
HTML/CSS/JS, no build step, no dependencies) built from a Claude Design mockup.
Articles are Markdown files rendered in the browser.

## Structure

```
index.html                 Landing page (hero, projects, articles)
article.html               Article template — reads ?slug=, renders a post
assets/
  css/styles.css           Theme, animations, component styles
  js/articles.js           Article manifest (the list + metadata)
  js/markdown.js           Tiny Markdown -> HTML renderer (no dependencies)
  js/main.js               Landing-page interactions + article cards
  js/article.js            Article-page rendering
content/articles/*.md      One Markdown file per post
.nojekyll                  Serve files as-is on GitHub Pages
```

## Run it locally

The article page uses `fetch()` to load Markdown, which browsers block on
`file://`. So open it through a local web server, not by double-clicking the file:

```bash
# from this folder (C:\Users\Adiel\Blog)
python -m http.server 8000
# then open http://localhost:8000/
```

No Python? `npx serve` or any static server works too.

## Add a new article

1. Create `content/articles/<slug>.md` — plain Markdown, start with a `# Title`.
2. Add an entry to `assets/js/articles.js` with a matching `slug`:

   ```js
   {
     slug: 'my-post',
     tag: 'Client',                 // Client | Server | AI | Engine
     tagColor: '#ff6b4a',
     tagBg: 'rgba(255,107,74,0.14)',
     accent: 'coral',               // coral | gold | green | white (card hover)
     title: 'My post title',
     excerpt: 'One-line teaser for the card.',
     date: 'Jul 2026',
     status: 'draft',               // 'draft' shows a placeholder
   }
   ```

3. When it's ready to go live, set `status: 'published'`. Drafts show the
   "coming soon" placeholder; published posts render the Markdown file.

The Markdown renderer supports headings, paragraphs, **bold**/*italic*, inline
`code`, fenced code blocks, ordered/unordered lists, links, images, blockquotes,
and `---` rules.

## Swap the placeholder art

Project cards and the ClashUp spotlight use inline SVG placeholder images
(`data:image/svg+xml,...`) in `index.html`. Replace a card's `<img ... src="...">`
with a real screenshot — either a path like `assets/img/pokerface.png` (drop the
file in a new `assets/img/` folder) or your own data URI.

## Deploy to GitHub Pages

Once pushed to a GitHub repo, enable Pages:
**Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**.

The site goes live at `https://<your-user>.github.io/<repo>/`. Because Pages
serves over HTTPS, the Markdown `fetch()` works in production exactly as it does
behind the local server. Update the site by committing and pushing — Pages
redeploys automatically.

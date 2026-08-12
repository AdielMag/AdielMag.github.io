# I missed Rider's Find in Files, so I rebuilt it for VS Code

I spent years in JetBrains Rider. Then most of my day-to-day moved to VS Code - AI
tooling, the web stack, the server side of ClashUp - and one thing kept snagging me
every single hour: **search**.

Not because VS Code's search is bad. It's fine. It's just *stuck to the side of the
window*, results are a squished tree in a 300px panel, and previewing a hit means
opening the file and losing your place. In Rider, Find in Files is a big centered
modal with a real code preview, and you can shove it onto a second monitor. Muscle
memory kept reaching for that and hitting a sidebar instead.

So I built [**Better Find in Files**](https://github.com/AdielMag/better-find-in-files) -
a VS Code extension that brings the Rider-style Find & Replace experience over.
TypeScript, MIT, on the Marketplace and Open VSX.

![One query fans out to three engines - ripgrep for text, a fuzzy path scorer for files, and the language server for symbols - merged into one result list with a live preview pane](assets/img/bfif-modes.svg)

## One shortcut, four modes

`Ctrl+Shift+F` opens a panel with a tab bar: **Text**, **Files**, **Symbols**, **All**.

- **Text** is content search, backed by ripgrep.
- **Files** is fuzzy filename/path search.
- **Symbols** asks your language server for workspace symbols.
- **All** runs the three and returns one sectioned list.

That last one is the mode I actually live in. Most of the time I don't know *what
kind* of thing I'm looking for - is `MatchmakingQueue` a class, a file, or a string
in a config? In VS Code that's three different keybindings and three different UIs.
Here it's one query and three labelled sections.

The fuzzy scorer for Files is deliberately dumb and deliberately fast: an exact
substring wins outright (scored by how late in the path it appears, so `queue.ts`
beats `queue/legacy/old.ts`), and otherwise the query characters just have to appear
in order, scored by how tightly they cluster. Consecutive matches are worth more than
scattered ones. That's the whole algorithm, and it's indistinguishable from something
cleverer at the sizes real repos actually are.

## The search itself: borrow VS Code's own ripgrep

Search performance was the part I refused to compromise on, and it turned out to
require almost no work - because **VS Code already ships ripgrep**. It's sitting in
the install directory powering the built-in search. So on startup the extension goes
looking for it:

```
appRoot/node_modules.asar.unpacked/@vscode/ripgrep/bin/rg[.exe]
appRoot/node_modules/@vscode/ripgrep/bin/rg[.exe]
appRoot/node_modules.asar.unpacked/vscode-ripgrep/bin/rg[.exe]
```

Three candidate paths, first hit wins, then a `require('@vscode/ripgrep')` as a last
resort. No binary bundled, no download step, nothing to keep in sync with anyone's
platform.

![Results stream from ripgrep's stdout into the panel line by line, with a safe fallback to the VS Code search API when the binary is missing](assets/img/bfif-pipeline.svg)

Results **stream**. The extension spawns `rg --vimgrep`, and every chunk of stdout is
split on newlines, parsed, and pushed to the panel - with one leftover partial line
carried into the next chunk, because a process boundary lands mid-line far more often
than you'd guess. You see the first hits while ripgrep is still working through the
rest of the repo, and cancelling just kills the child process.

Two details cost more thought than they deserved:

**Windows paths.** ripgrep's `--vimgrep` output is `path:line:col:text`, and you parse
it by splitting on `:`. On Windows, `C:\src\Foo.cs:42:8:...` has a colon in the drive
letter, so a naive split hands you a file called `C` on line `\src\Foo.cs`. The parser
sniffs for that case and re-joins the first two fields.

**The fallback.** If ripgrep isn't found, or the spawn fails, or it errors mid-run, the
whole thing falls back to `vscode.workspace.findFiles` plus a regex sweep - slower, but
it works everywhere, and it means a weird VS Code install degrades instead of breaking.
Non-regex queries get escaped, whole-word wraps in `\b`, so both engines answer the
same question the same way.

## Making a webview act like a window

The Rider feel isn't only about the search - it's that the panel is a real floating
window you can park on a second monitor. VS Code gives you exactly one lever for that:
`workbench.action.moveEditorToNewWindow`. So the panel opens as a normal webview
editor and then, on a short timer, detaches itself into its own OS window.

Living in that space turned up a few sharp edges worth writing down:

- **Capture the editor state *before* creating the panel.** The moment a webview takes
  focus, `vscode.window.activeTextEditor` goes `undefined` - so if you wait until after
  the panel exists to grab the current selection to seed the search box, it's already
  gone.
- **Never pass a view column when re-revealing.** Passing one yanks an already-floated
  panel back out of its window and into the main one. `reveal()` with no arguments
  leaves it where the user put it.
- **Focus needs saying twice.** The panel posts a `focusInput` message at 100ms and
  again at 300ms after opening, and again whenever the panel becomes active. One
  message is reliably too early - it lands before the webview's DOM is listening, and
  you get a floating search box that ignores your typing.

The result: hit the shortcut, start typing immediately, hit it again to toggle the
panel closed.

## The two features I now can't work without

**Explorer highlighting.** Files matching the current query get badged in VS Code's
Explorer tree, live, as you type. Search a symbol and the file tree quietly tells you
the shape of the answer - which folders it's in, how spread out it is - before you read
a single result.

**Usages CodeLens.** In Rider I click a method name to see its usages. That gesture
can't be intercepted by an extension - Ctrl/Alt+Click is handled entirely inside VS
Code's core editor, with no hook to hang anything on. So instead a clickable `Usages`
lens sits above every function, class, method, property, and enum declaration
(pulled from the document symbol provider, walked recursively so nested members get
one too). Clicking it opens the panel with the symbol pre-filled, showing **real
semantic references from the language server** - not text matches that also hit
comments and unrelated same-named things.

There's also a file-type filter that scans your workspace for the extensions actually
present, frequency-sorted, cached in workspace state for a week. And an editable
preview pane: fix the typo you just found in the preview, `Ctrl+S`, done, without ever
opening the file.

## Was it worth it

For a tool I use several hundred times a day - obviously yes. But the more interesting
takeaway was how much of it was *assembly* rather than invention. The fast search
engine was already installed. The symbol index was already running. The semantic
reference data was already there behind the language server. Nearly all of the actual
work was in the seams: parsing a colon-delimited format on the one OS where colons are
ambiguous, and convincing a webview to behave like a window.

Grab it from the
[repo](https://github.com/AdielMag/better-find-in-files) - issues and PRs welcome.

*More devlog - netcode, servers, tooling - on the [article list](index.html#articles).*

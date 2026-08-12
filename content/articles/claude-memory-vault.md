# Giving Claude a memory: a git-tracked knowledge vault

I build ClashUp mostly with an AI pair - Claude Code - sitting alongside me. And the
single biggest thing that made that partnership actually *work* wasn't a cleverer
prompt. It was giving the AI a **memory** that survives between sessions.

Out of the box, every session starts cold. The model re-derives what it already
figured out last week, re-asks questions I've already answered, and occasionally
"fixes" something back to a state I deliberately moved away from. That last one is
the expensive failure. The fix is a persistent, project-scoped knowledge base that
lives in the repo, and the interesting part is *how* it's structured so it stays
fast as it grows.

## The trick: an index, not a pile

The naive version of AI memory is one giant file that gets loaded every session. That
works for a week. Then it collapses under its own weight: the file balloons, and
you're paying to load all of it on every single request, most of it irrelevant.

Instead, only a tiny **index** loads automatically at the start of a session. Every
individual fact is its own small note, and those notes are pulled in *on demand* -
only when the current task actually touches them.

![Session start loads only the MEMORY.md index; individual topic notes are read on demand by following the index's links, not by scanning folders](assets/img/memory-recall.svg)

The index is a list of one-line pointers, one per note, each a link plus a few words
of hook - enough for the model to decide whether the note is worth opening. When I
ask about netcode, it follows the netcode link and reads that note. The fifty notes
about things unrelated to today's task stay on disk. They cost nothing.

This is the whole reason it scales. Recall is **index-driven, not a folder scan**.
The index stays small, so loading it every session is basically free, and hundreds of
topic notes can pile up behind it without bloating the conversation. Folders become
free organization too: since recall follows the index's links rather than walking
directories, I can re-sort notes into topic folders whenever I like without ever
breaking the AI's ability to find them.

## Living in the repo, browsable by me

The second decision: the memory isn't hidden away in some tool's private storage. It
lives **inside the repository**, as plain Markdown, in the same folder I keep the rest
of the project's docs - which happens to be an Obsidian vault.

![The vault sits in the repo, read by Claude, browsed by me in Obsidian, and versioned by git - all three views of the same notes](assets/img/memory-vault.svg)

That one placement decision buys three different things from the same files. The AI
reads them as its memory, following links to recall facts. I read them in Obsidian as
a linked wiki, which means I can see exactly what the assistant thinks it knows, and
correct it when it's wrong. And git versions them: every memory the AI writes shows
up as a commit in the same history as the code, so a bad "fact" gets reverted the
same way bad code does.

That third one matters more than I expected. A wrong memory is worse than no memory,
because the model acts on it confidently. Nothing else catches those. Seeing new notes
arrive in a diff, right next to the change that prompted them, is the only review step
that has ever caught one before it did damage.

There's a companion idea too: a set of project *rules* - conventions like naming and
async discipline - that automatically come into play when the AI edits the kind of file
they apply to. The memory captures what's *true* about the project. The rules capture
how I want things *done*.

## The part that compounds

The knowledge base and the code now evolve together, in one history. When a decision
changes, the note changes in the same commit, so the memory can't quietly drift out
of sync with the thing it describes.

That's the real unlock of AI pair-programming for me. The model was always smart in the
moment. What it wasn't, was *cumulative*. Now it gets more useful on my specific
project every week instead of starting over every morning.

*More from the ClashUp devlog - the netcode and the tooling - on the
[article list](index.html#articles).*

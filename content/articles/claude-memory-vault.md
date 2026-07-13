# Giving Claude a memory: a git-tracked knowledge vault

I build ClashUp mostly with an AI pair — Claude Code — sitting alongside me. And the
single biggest thing that made that partnership actually *work* wasn't a cleverer
prompt. It was giving the AI a **memory** that survives between sessions.

Out of the box, every session starts cold. The model re-derives what it already
figured out last week, re-asks questions I've already answered, and occasionally
"fixes" something back to a state I deliberately moved away from. The fix is a
persistent, project-scoped knowledge base that lives in the repo — and the interesting
part is *how* it's structured so it stays fast as it grows.

## The trick: an index, not a pile

The naive version of AI memory is one giant file that gets loaded every session. That
works for a week and then collapses under its own weight — the file balloons, and
you're paying to load all of it on every single request, most of it irrelevant.

Instead, only a tiny **index** loads automatically at the start of a session. Every
individual fact is its own small note, and those notes are pulled in *on demand* — only
when the current task actually touches them.

![Session start loads only the MEMORY.md index; individual topic notes are read on demand by following the index's links, not by scanning folders](assets/img/memory-recall.svg)

The index is just a list of one-line pointers: "netcode → this note," "physics → that
note." When I ask about netcode, the AI follows the netcode link and reads that note.
The fifty notes about things unrelated to today's task stay on disk, costing nothing.

This is the whole reason it scales. Recall is **index-driven, not a folder scan**:

- The index stays small, so loading it every session is basically free.
- Hundreds of topic notes can pile up without bloating the conversation, because they
  load only when relevant.
- Folders become free organization — since recall follows the index's links, I can sort
  notes into topic folders without ever breaking the AI's ability to find them.

## Living in the repo, browsable by me

The second decision: the memory isn't hidden away in some tool's private storage. It
lives **inside the repository**, as plain Markdown, in the same folder I keep the rest
of the project's docs — which happens to be an Obsidian vault.

![The vault sits in the repo, read by Claude, browsed by me in Obsidian, and versioned by git — all three views of the same notes](assets/img/memory-vault.svg)

That one placement decision pays off three ways at once:

- **The AI reads it** as its memory, following links to recall facts.
- **I read it** in Obsidian, browsing the same notes as a linked wiki — so I can see
  exactly what the AI "knows," and fix it when it's wrong.
- **Git versions it.** Every memory the AI writes shows up as a commit in the same
  history as the code. I can review it in a diff, and revert a bad "fact" the same way
  I'd revert bad code.

There's a companion idea too: a set of project *rules* — conventions like naming and
async discipline — that automatically come into play when the AI edits the kind of file
they apply to. The memory captures what's *true* about the project; the rules capture
how I want things *done*.

## Why this matters beyond one game

The knowledge base and the code now evolve together, in one history. When a decision
changes, the note changes in the same commit — so the AI's memory can't silently rot
away from reality, because it's reviewed like everything else.

That's the real unlock of AI pair-programming for me: not that the model is smart in
the moment, but that it *accumulates* — it gets more useful on my specific project every
week, instead of starting from zero every morning. A memory it can read, I can browse,
and git can track turns a clever assistant into a genuine long-term collaborator.

*More from the ClashUp devlog — the netcode, the physics, the tooling — on the
[article list](index.html#articles).*

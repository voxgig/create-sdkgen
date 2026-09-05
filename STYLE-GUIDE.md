# Documentation style guide

How the Voxgig Create SDK Generator documentation is written. This guide
is normative for the root [`README.md`](./README.md) — 1 page, the one a
reader lands on from GitHub and npm. It exists so that a page written
next year sounds like a page written this year, and so that a reviewer
can point at a rule instead of arguing taste.

It is a port of [jostraca/jostraca](https://github.com/jostraca/jostraca)'s
guide, by way of [voxgig/struct](https://github.com/voxgig/struct)'s,
which share an author and a house voice with this project. The structure
and most of the rules are those projects'. Where this one differs — the
spaced em dash, the working-document set, the shape of the four kinds —
the difference is recorded with the measurement behind it, because a
divergence nobody wrote down reads later as drift.

Three sources feed the guide, in a fixed priority order. The same order is
encoded in [`.vale.ini`](./.vale.ini), and every rule switched off there
names the reason and the count it produced:

    house voice  ->  Google  ->  Vale defaults

1. **This file.** Where it rules, it rules. The house voice is Richard
   Rodger's blog register, and the places it wins are listed with their
   reasons rather than left as silent exceptions: the spaced em dash,
   first-person plural in tutorials, British spellings, and quotation
   punctuation outside the quotes.
2. The [Google developer documentation style
   guide](https://developers.google.com/style) for everything this file
   does not cover: second person, present tense, active voice,
   sentence-style capitalisation in headings, serial commas, one idea per
   sentence.
3. [Vale](https://vale.sh) defaults, which mostly means spelling.

Two gates check it, and both run in CI:

| Gate | Runs | Checks |
|---|---|---|
| `vale --minAlertLevel=error $(python3 tools/check_prose.py --files)` | `make scan-prose`, `.github/workflows/docs.yml` | Google's rules plus the banned list, at the levels set in `.vale.ini` |
| `python3 tools/check_prose.py` | `make scan-prose`, `npm run scan-prose`, and the same workflow | the banned list, the em-dash spacing and ration, the first-person rules, no emoji, no citations of a working document, that every relative link resolves, and that the page set is complete |

The banned list is read from one file by both, so they cannot drift. The
page set comes from one function, `tools/check_prose.py --files`, for the
same reason: a gate reading a smaller set than the other is a gate that
reports green on a page nobody checked.

There is no `make test` here to hang the gate from: npm owns the test
run, and the build matrix includes Windows, where `python3` is not a
given. The workflow is the gate that blocks; the two local commands are
for running it before you push.

A Google rule sitting at `warning` rather than `error` was tried at error
level first and found wrong for these pages; `.vale.ini` records what it
produced and why it was demoted.

## The structure: four kinds, one doorway

This repository has one reader-facing page, and it is a doorway. The
README routes: the quick start, the option table, what you edit and what
is generated, and where the rest lives. It states no fact of its own that
the page it points to does not also state.

The four kinds — tutorial, how-to, reference, and explanation — live in
the [sdkgen documentation](https://github.com/voxgig/sdkgen/tree/main/docs),
which is where a reader goes from the README for the step-by-step first
SDK, the model reference, and the generator's flags. The README says
enough to scaffold a project and start the edit loop, then hands over.
A page that argues design or lists every option is a page that belongs
in that tree, not here.

**Documentation never names the framework.** The four kinds come from
`Diátaxis`, and that is a fact about how these pages were planned, not
one a reader needs in order to read them. Say **tutorial**, **how-to**,
**reference** and **explanation**, which are ordinary words that describe
themselves, and let the structure do the explaining. This guide and the
contributor guides are where the name belongs, because there it answers a
question somebody is actually asking.

### The scaffold is not documentation

Everything under `project/` is copied into a generated SDK project by
`create-sdkgen`. The Markdown files in there (`project/standard/.sdk/**/README.md`)
are read by the person who owns that project, inside a tree sdkgen
generates into, and they follow sdkgen's rules rather than this guide.
The gate does not read them, and `.vale.ini` switches every style off
under `project/` so that a bare `vale .` does not either.

## Documentation does not cite a working document

**A documentation page never sends a reader to a plan, a review, or an
agent instruction file.** Those are working documents: written for the
people changing this repository, argued rather than stated, and stale the
moment the code moves past them. A reader who follows a link out of the
documentation and lands in one has been handed the project's notes in
place of an answer.

The banned set, by name:

| Document | What it is |
|---|---|
| `AGENTS.md` | the end-to-end guide for an agent building an SDK with the toolchain, written as instructions rather than documentation |
| `CLAUDE.md` | the same shape, guarded in advance; this repository does not carry one |
| any `*_PLAN.md` or `*_REVIEW.md`, and `BUILD_LOG.md` | the shapes this project has not needed yet, guarded in advance |

The ban covers the name as much as the link. "The full checklist is in
`AGENTS.md`" fails for the same reason the URL does: the reader still
cannot act on the sentence without leaving the documentation.

State the fact instead. "Shape the SDK by editing the model, then
regenerate; every code block in a generated target's docs is compiled and
run by that target's tests" is what a reader needs, and a link to the
file that also says so adds nothing to it. The README used to close its
tour by sending an agent to `AGENTS.md` for the workflow, the edit rule,
and the doc-example tests; it now states all three. Where the fact belongs
in the documentation and is missing, write it into the page that owns it
rather than pointing outside.

The rule runs one way. Working documents cite each other and cite the
documentation freely. Only the direction out of documentation is closed.

### What stays linkable, and why

| Linkable | Because |
|---|---|
| source and tests: `bin/create-sdkgen`, `src/`, `test/` | code is the thing a claim is pinned to |
| `CONTRIBUTING.md` | a contributor guide, not a working document: it states how to validate a change and why a fork's pull request gets no CI, facts a reader acts on. It may itself cite the working documents, because the rule runs one way |
| this guide | normative rather than exploratory, and it names the working documents in order to ban them |
| the sdkgen documentation | the tutorial, reference, and explanation pages this README is the doorway to |

The rule behind the split: **a specification is citable, an argument is
not.**

`tools/check_prose.py` enforces this over the reader-facing pages. Vale
does not, because Vale cannot tell a working document from a page.

## The voice

The house voice is Richard Rodger's blog register, adapted per document
kind. The portable part of that voice is its *rhythm*, not its stock
phrases. Ten habits, with the register they apply in:

1. **Open with a concrete fact or a plainly stated problem, then a short
   dry beat.** Tutorials and how-tos. Reference pages open by stating
   what the thing is.
2. **Introduce code with a short colon-terminated sentence** — "From a
   spec to a tested SDK, in four steps:", "The loop from here is:". Never
   "The following code snippet demonstrates". Everywhere.
3. **After a code block, point at the one interesting thing.** Do not
   recap the code. Everywhere.
4. **Parentheses carry definitions, caveats, and at most one dry aside per
   page.** Tutorials and how-tos. In reference pages, parentheses carry
   facts only — a type, a default, a test name.
5. **A trade-off gets bolted on with a dash, and the dash earns its
   place.** One per paragraph at most, never two in a sentence. The gate
   enforces the one-aside-per-line half of that; the paragraph half is
   a review matter.
6. **Alternate one long explanatory sentence with one short verdict
   sentence.** The short sentence is the payoff. Everywhere.
7. **Talk to the reader as "you", and route them** ("If you only want
   the option table, skip to…"). "We" appears only in a tutorial, walking
   through code together, and this repository has none. "I" appears
   nowhere.
8. **Show that the code is real.** This repository's own suite (`test/`)
   exercises the scaffold, not the README's commands, so a claim on the
   README names what covers it: the option table is
   `bin/create-sdkgen`'s own parser, and the scaffold's shape is pinned
   by `test/create-sdkgen.test.ts`. The claim that every code block in a
   generated SDK's docs is executed belongs to sdkgen, whose
   `readme_examples` test does it; the README repeats the claim and says
   whose test it is.
9. **Jokes are self-directed or about the industry's mundanity, and the
   register goes fully serious the moment correctness or a user's data is
   on the table.** Never joke about the reader, other tools, or the
   consequences of an overwrite — generation overwrites the target
   directories, and the README says so plainly.
10. **Close by handing the reader something**: a link, a next step, one
    sentence. No summary paragraphs that restate the page.

Exclamation marks: at most one per page, in tutorials only, on a genuine
payoff.

## Banned phrases and patterns

These read as generated filler. Do not use them, in any document,
including commit messages that quote the docs.

**The list itself lives in
[`.vale/styles/config/vocabularies/CreateSdkgen/reject.txt`](./.vale/styles/config/vocabularies/CreateSdkgen/reject.txt)**,
one regular expression per line. That file is the single source of truth:
Vale reads it in CI, and `tools/check_prose.py` reads the same file rather
than keeping a second copy, so the two gates cannot disagree about what is
banned. Add a phrase there and both pick it up. What follows is a reader's
summary of it, not a second list; every phrase is shown as code so that
quoting a banned phrase in this guide does not fail the gate.

The list is upstream's, unchanged, and it draws on two sources: that
project's original house list, and [claudisms.ai](https://claudisms.ai/),
a catalogue of the patterns that mark machine-written prose. **It was
measured against these pages before it was adopted.** No entry fired on
the one page, and nothing was dropped from the list.

**Filler and false emphasis**: `worth noting` · `important to note` ·
`it cannot be overstated` · `at its core` · `when it comes to` ·
`let's break it down` · `here's where it gets interesting` ·
`the point is` · `because it matters`.

**Inflated vocabulary**: `delve` · `dive into` · `robust` · `seamless` ·
`comprehensive` · `holistic` · `intricate` · `leverage` · `foster` ·
`shed light on` · `pave the way` · `pivotal` · `transformative` ·
`game-changing` · `cutting-edge` · `groundbreaking` · `testament to` ·
`paradigm shift` · `realm` · `landscape of` · `underscores the` ·
`lean into` · `throughline` · `double-click on` · `mature setup`.

**Consultant register**: `north star` · `key takeaways` ·
`best practices` (name the practice instead) · `at the end of the day` ·
`pressure-test` · `right-size` · `strategic imperative` ·
`three things to know` · `dispatches from` · `best operators` ·
`lessons learned`.

**Metaphor inflation**: `load-bearing` · `heavy lifting` ·
`is doing the work` · `different physics` · `hits hardest` ·
`quietly` (say `silently`, which is the term of art for a failure that
reports nothing).

**The contrast frame and its cousins**: `not just` · `not only X but Y` ·
`it's not about` · `the whole game` · `the entire point` ·
`the only thing that matters`. Say what the thing is.

**False singularity**: `the right way/answer/tool/question` ·
`the best thing you can do` · `if I had to pick` · `what struck me` ·
`stuck with me` · `struck a chord` · `hit a nerve` ·
`we've seen this movie before`.

**Reflective pose**: `sit with` · `worth exploring/considering/asking` ·
`keeps coming back to` · `that's the tell` · `where I landed`.

**Invented observation about people**: `most people` ·
`everyone I've worked with` · `a lot of folks` · `nobody I know`. If it
did not happen, do not claim to have noticed it.

**Signposting**: `let's explore` · `now let's turn to` · `moving on to` ·
`in today's rapidly evolving` · `reflecting a broader trend` ·
`great question`.

**`honest`, and every form of it**, is banned differently from the rest.
The word is fine English; it is on the list because it had become a tic
across the repositories that share this list, where it flattered a
sentence rather than said anything the sentence did not already say. It
had not reached this page when the list arrived.

**The gate is absolute, and the lack of an inline exemption is the
point.** There is no `allow` comment and no suppression the second gate
would honour, because an escape hatch that exists is an escape hatch that
gets used. A use the author wants kept is approved by changing
`reject.txt`: one line, in one file, visible in review, which is where an
approval belongs.

### What is not banned, and why

Several entries on claudisms.ai are deliberately absent, because they name
things this project documents. A gate that fires on the subject matter is
a gate people learn to switch off. The same standard governs
`CreateSdkgen.WordChoice`, which carries three of Google's substitutions
and leaves the rest at warning.

| Not banned | Because |
|---|---|
| `model` | It is the thing apidef writes and you edit: `.sdk/model/*.aontu`, the source of truth every SDK is generated from. |
| `shape` | `shape` is the package that validates the command's options, and "you shape the SDK by editing the model" is the README's own verb for the edit loop. |
| `carry` | A generated target carries a `readme_examples` test; a page carries a fact. |
| `surface` | The API surface is what the generated SDK exposes as entities, and there is no other word for it. |
| `lives` | `the list itself lives in` is this guide, one section up. |

The rule behind the list: ban the phrase that adds nothing, never the word
that names a thing.

**Matching spans a line wrap.** These pages hard-wrap, and most of the
list is multi-word, so the gate joins each paragraph before matching:
`worth\nnoting` fails exactly as `worth noting` does. Upstream records
that the day its gate started reading paragraphs it found two phrases that
had been passing since the gate was written, each saved only by where its
line happened to break.

**Patterns** (not mechanically checkable, enforced at review):

- Announcing structure before delivering it ("There are three things to
  understand").
- Restating the question before answering it.
- A closing one-liner that restates the thesis.
- Stacked short declaratives (four or more in a row).
- Superlative self-ranking ("the most important thing", "the part that
  matters most").
- A list of `**Bold term**: explanation` pairs, which is the single most
  recognisable machine-written list. Write sentences, or a table.

## Punctuation rulings

**The em dash is spaced here**: `a dash — like this`. This is the one
place where the guide contradicts both Google and jostraca, and it is the
Voxgig convention rather than drift — 4 spaced dashes across the 1 page
when the gate was written (5 before the sentence citing `AGENTS.md` came
out), and not one unspaced. `Google.EmDash` is therefore off, and
`tools/check_prose.py` `em-dashes-are-spaced` enforces the convention in
the other direction: an unspaced dash fails.

Dashes stay **rationed to one aside per line**: either a single dash
before a trailing clause, or one matched pair around a parenthetical,
never both and never two asides. Three on a line is the stacking the
ration exists to stop. Prefer a comma or parentheses when the aside is
mild.

The rest:

- In a link list, separate the link from its gloss with a full stop, not a
  dash:

  ```markdown
  - [`CONTRIBUTING.md`](./CONTRIBUTING.md). How to validate a change before you push.
  ```

- **Every relative link must resolve, and stay inside the repository.**
  `tools/check_prose.py` checks the path, not the anchor, since a heading
  slug depends on the renderer; it reads both the inline form (the text
  in brackets, the target in parentheses) and the reference form
  `[text][label]` with its definition. A target that resolves on a Linux
  runner but climbs out of the checkout resolves nowhere on GitHub or in a
  published package, so it fails too. Every link resolved the day the
  check was written; the only relative link the page had pointed at
  `AGENTS.md`, which resolved and was removed for citing a working
  document, not for being broken.
- No emoji in documentation.
- Sentence-style capitalisation in headings (Google style), except where
  the heading names a proper noun or a code identifier: `create-sdkgen`
  is the page title and a package name, and keeps its casing; `After the
  scaffold` is sentence case, as the rest are.
- British spellings (`-ise`, `-isation`) for new prose. Google style is US
  English and so is the dictionary; this is one of the places the house
  voice wins, and
  [`accept.txt`](./.vale/styles/config/vocabularies/CreateSdkgen/accept.txt)
  carries the British forms — **listed one by one**, never matched by
  suffix, because `\w+ise` accepts any word ending in those three letters
  and punches a hole straight through the spelling gate. A US spelling
  already on a page is not a defect, and a filename keeps whatever
  spelling it was created with.
- Quotation punctuation goes **outside** the quotes, against US
  convention, because putting a period inside a quoted `code span` is
  actively wrong when the quote is a literal.

## Terminology

- The project is **Voxgig Create SDK Generator** in a title, and
  **`create-sdkgen`** in prose, which is also the command; the package is
  `@voxgig/create-sdkgen` on npm. **The toolchain** is the three packages
  together: `create-sdkgen`, `@voxgig/apidef`, and `@voxgig/sdkgen`.
- **the scaffold** — what `create-sdkgen` writes: an SDK project with a
  `.sdk/` build folder wired to sdkgen. "Scaffold" is the verb and the
  noun. Not "template", which is sdkgen's word for a per-language file
  copied verbatim into a target, and not "boilerplate".
- **an SDK project** — the output directory (`-o`, default
  `<name>-sdk`). Its **`.sdk/`** folder holds the model and the build;
  the directories beside it (`ts/`, `py/`, `go/`, …) are **generated
  output**, overwritten on every generate. Never "the SDK source" for
  something you might edit.
- **the model** — `.sdk/model/*.aontu`, the source of truth you edit.
  **apidef** writes it from the spec; **sdkgen** generates the SDKs from
  it. Say the tool's name for the step, and "the model" for the thing.
- **the spec** — the OpenAPI 3 file passed as `-d`/`--def`. Say "spec" in
  prose; `def` is the flag and the model key, and stays in a code span.
- **entity** — a semantic unit of the API surface (`client.Advice()`),
  with only the operations it has: `list`, `load`, `create`, `update`,
  `remove`. Not "resource", not "endpoint", which is the URL the entity
  hides.
- **target** — what `target add` adds: a language such as `ts` or `py`,
  or a program such as `go-cli` or `go-mcp`. Say **language** only when
  you mean the language, since `go-cli` and `go` are two targets in one.
- **feature** — what `feature add` adds; `test` is the one every project
  needs, and it is **offline test mode**, not "mock mode".
- **generated docs** — the `README.md` and `REFERENCE.md` in a target are
  output driven by the model, and the target's tests run every code
  block in them. Say "the target's docs" rather than "the documentation",
  which here means the sdkgen tree.

## Templates, kind by kind

This repository has one page, a doorway. A page of one of the four kinds
added here follows the template for its kind:

**Tutorial**: goal sentence → snippet → output → the one observation →
forward link. Every step's output shown.

**How-to guide**: title is the task in imperative or "-ing" form; one
sentence of situation; the recipe; one paragraph of what to watch for;
links to the reference for the constructs and to the tutorial for the
basics it assumes.

**Reference page**: definition, then behaviour, then edge cases, then a
pinned example. Every claim that has a test can name it.

**Explanation page**: the question, the answer, the argument, the
trade-off admitted. May quote history when the history is the argument.

## Updating this guide

Change it the way behaviour changes: in the same commit as the first page
that follows the new rule, with the reasoning in the commit message.

To ban a phrase, add the regular expression to
[`reject.txt`](./.vale/styles/config/vocabularies/CreateSdkgen/reject.txt)
and summarise it in the preceding list. Both gates pick it up from that
one file; there is no second list to update, and `tools/check_prose.py`
names this file, so a drift is a build failure with a pointer.

To change a Google rule's level, edit [`.vale.ini`](./.vale.ini) and write
down what the rule produced on a clean run. "It was noisy" is not a
reason; "it maps `touch` to `tap`, and it objects to `snake_case`, which
this project names on purpose — 143 hits" is. A rule demoted without that
note reads later as an oversight, and gets re-promoted by someone
repeating the work.

To widen what the gates read, change the configuration block at the top
of `tools/check_prose.py`. Both gates take their file set from it, so
widening it once widens both — and a page added to the repository without
being added there is a page neither gate has ever read.

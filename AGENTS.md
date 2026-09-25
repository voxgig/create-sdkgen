# AGENTS.md — build an SDK with @voxgig/sdkgen

## Temporary local tool development

Prefer local symlinks to sibling tool checkouts when developing or testing
unreleased Voxgig tools together. Link to the actual package root (for example,
`apidef/ts` or `sdkgen/ts`), build that checkout, and verify that the consumer
resolves the linked code. Use existing validator local-path options where
available.

Do not create or copy `.zip`, `.tgz`, or `npm pack` snapshots into SDK projects
or ad hoc `vendor/` folders just to use local changes. Keep temporary links in
ignored dependency directories; keep machine-specific paths and temporary
`file:` dependencies out of committed manifests and lockfiles. Shared builds
and CI should use published versions or explicitly check out and build the
required source revisions.

Archives are appropriate when testing package contents or installation from a
packed release. Put those artifacts in a temporary test directory and clean
up artifacts created by the test afterward; do not scatter them across repos.

This is the **starting point** for an AI agent (or human) building a new
multi-language client SDK from an OpenAPI spec, using the Voxgig SDK
Generator toolchain. `create-sdkgen` scaffolds the project; the rest of the
toolchain generates and tests the SDKs.

If you are here to **modify the generator itself** (templates, components,
language targets), you want [`@voxgig/sdkgen`'s AGENTS.md](https://github.com/voxgig/sdkgen/blob/main/AGENTS.md)
instead — this guide is about *consuming* the generator to produce an SDK.

## Status output from long-running work

Every transient task reports its status at least every 30 seconds, even if
the report is one line, with a percentage-complete estimate wherever one can
be computed (items done of items total, phases done of phases). That covers a
build, a test or validation run, a script, a background agent, and a wait on
CI or a release. It covers an agent's own updates to the person it works for
too: relay progress at the same cadence rather than going quiet until the
work is done. Silence longer than that cannot be told apart from a hang.

---

## Mental model

One source of truth — a **model** — drives everything. You edit the model;
every SDK is regenerated from it.

```
OpenAPI 3 spec  ──apidef──▶  model (.sdk/model/)         ──sdkgen──▶  ts/  py/  go/  php/  rb/  lua/  (+ go-cli, go-mcp)
   (your API)                (the source of truth you edit)             (generated SDK source — NEVER hand-edit)
```

- **`@voxgig/apidef`** parses your OpenAPI spec into the model (entities, ops, fields, types). See [apidef/AGENTS.md](https://github.com/voxgig/apidef/blob/main/AGENTS.md).
- **The model** (`.sdk/model/`, unified by `aontu`) is what you edit to shape the SDK. Every model file is `.aontu`, the only extension aontu reads (it refuses an include that names a `.aon` file): what apidef writes (entities, flows, API info, the guide), the scaffold's own files (`sdk.aontu`, `config.aontu`, `project.aontu`), and the target/feature/edition indexes and items that sdkgen and docgen write. A project from before the rename is migrated by re-scaffolding it (see "Re-scaffolding an existing project" below).
- **`@voxgig/sdkgen`** renders the model into idiomatic per-language SDK source via `jostraca`. See [sdkgen/AGENTS.md](https://github.com/voxgig/sdkgen/blob/main/AGENTS.md).

The API surface is exposed as **semantic entities** (Capitalised — e.g.
`client.Advice()`), not raw URL paths. Each entity offers only the operations
it actually has, drawn from `list`, `load`, `create`, `update`, `remove`.

---

## Prerequisites

- Node.js 24 or later (the floor aontu and sdkgen declare).
- An **OpenAPI 3** spec for your API (`.yaml` or `.json`).
- That's it — the toolchain is npm packages; no other services required to generate + test offline.

---

## The workflow (spec → tested SDK)

### 1. Scaffold the project

```
create-sdkgen <name> -d <path/to/openapi.yaml> -o <output-dir>
```

- `<name>` — the SDK name (kebab-case, e.g. `acme-billing`). Becomes the package base name.
- `-d, --def <spec>` — your OpenAPI spec file.
- `-o, --folder <dir>` — output directory.
- `-t, --target <langs>` — comma-separated targets to add during scaffold (e.g. `-t ts,py,go`). Optional; can also add later.
- `-f, --feature <features>` — features to add (e.g. `-f test`). Optional.
- `--no-install` — skip `npm install` (default is to install).
- `-h` / `-v` — help / version.

This produces `<output-dir>/` containing a **`.sdk/`** build folder wired to
`@voxgig/sdkgen`, plus the generated target directories once you generate.

### 2. Add targets and the test feature (if not passed to scaffold)

```
cd <output-dir>/.sdk
npx voxgig-sdkgen target add ts py go php rb lua   # pick the languages you want
npx voxgig-sdkgen feature add test                 # offline test mode — REQUIRED for the test suites
```

Available targets include `ts`, `js`, `py`, `go`, `php`, `rb`, `lua`, plus
`go-cli` and `go-mcp`. `target add` / `feature add` write `.sdk/model/target/<name>.aontu` / `.sdk/model/feature/<name>.aontu` and register each in `target-index.aontu` / `feature-index.aontu` beside it.

### 3. Generate the SDK source

```
npm run generate
```

`generate` first compiles the `.sdk` build sources (`tsc --build src` —
required; `voxgig-model` loads the compiled `.sdk/dist/` components), then
runs `voxgig-model model/sdk.aontu`, which compiles the model (`aontu`
unification) and runs the generator, writing SDK source into the
per-language directories (`../ts`, `../py`, …). Re-run this whenever you
change the model.

### 4. Verify — run the tests

Each target ships a full test suite **including doc-example tests** that
compile and execute every code block in the generated README/REFERENCE in
offline test mode (see "The guarantee" below):

```
cd ../ts  && npm install && npm run build && npm test
cd ../py  && python3 -m pytest test/
cd ../go  && go test ./...
cd ../php && composer install && vendor/bin/phpunit test/
cd ../rb  && make test
cd ../lua && busted -p _test test/
```

Green tests mean the SDK works and its documentation is correct.

---

## What you edit vs. what is generated

| Path | Role | Edit it? |
| --- | --- | --- |
| `.sdk/model/sdk.aontu` | Model entry — name, spec ref (`def`), imports; rewritten on re-scaffold | Rarely — put project decisions in `project.aontu` |
| `.sdk/model/project.aontu` | Project overlay — release versions, published package names; kept on re-scaffold | Yes |
| `.sdk/model/entity/*.aontu` | **Entities** — the semantic surface (ops, fields, types) | **Yes — this is the main lever** |
| `.sdk/model/guide/guide.aontu` | Guide — corrections to how apidef reads the spec (entity names, active paths and ops); kept on re-scaffold | Yes |
| `.sdk/model/target/`, `.sdk/model/feature/`, `.sdk/model/edition/` | Active targets, features, documentation editions; the indexes are kept on re-scaffold | Yes (or via `target add`/`feature add`/`edition add`) |
| `.sdk/model/api/*` | OpenAPI-derived info | Regenerated from the spec — avoid hand-editing |
| `ts/  py/  go/  php/  rb/  lua/` | **Generated SDK source** | **Never** — overwritten on every generate |
| `<target>/README.md`, `REFERENCE.md` | Generated docs | Never — driven by the model |

**Rule:** shape the SDK by editing the **model** (entities), then regenerate.
Anything under a target directory is output and will be overwritten.

### The edit loop

```
edit .sdk/model/entity/*.aontu  →  (cd .sdk && npm run generate)  →  re-run the target tests
```

Commit before regenerating — generation is destructive to the target dirs.

### Re-scaffolding an existing project

Re-run the same `create-sdkgen` command over the output directory to pick up
a newer scaffold. It rewrites the scaffold's own files and leaves the
project's alone: the guide, `project.aontu`, the target/feature/edition
indexes and the items they name.

It is also how a project from before the `.aontu` rename catches up: sdkgen
4.25 and later refuse a project whose entry is still `sdk.aon`.
Under `.sdk/model/` and `.sdk/test/`, a `.aon` file whose `.aontu` twin the
scaffold writes is removed; every other `.aon` file (indexes, items, the
project's own files) is renamed to `.aontu` with its content kept, and the
include directives naming it are rewritten — nothing else in the file
changes. If both names exist, the `.aontu` file wins and the `.aon` one is
left. Anything that cannot be migrated, such as an include pointing outside
`.sdk/`, is logged as a `migrate-aontu` warning naming the file; fix those by
hand. Commit first, and read the diff.

### What the standard Root generates

`.sdk/src/Root.ts` is one of the scaffold's own files, rewritten on
re-scaffold, so a project decides what it generates in `project.aontu`
instead of editing it:

| Declare | Effect |
| --- | --- |
| `main: kit: target: <t>: active: false` | `<t>` stays in the model and is not generated. |
| `main: kit: phase: top: active: false` | No SDK repository files at the root: README, AGENTS.md, CLAUDE.md, LICENSE, SECURITY.md, CHANGELOG.md, the release Makefile and the publish workflows. |
| `main: kit: phase: build: active: false` | No per-entity test data under `.sdk/test/entity/`, which only the SDK targets' own tests read. |
| `main: kit: target: <t>: output: root: true` | `<t>` is generated at the project root instead of `<t>/`. At most one target, and only with `phase: top` off, or the repository files would overwrite its own. |

Together they make a repository that is one package rather than an SDK: a
Seneca provider, say, that carries its own `.sdk/` and depends on an SDK
released from another repository. The decisions are in `src/RootPlan.ts`,
which imports nothing so that this repository's tests can load it.
`admin/check-drift.sh` follows them: a target generated at the root owns
every tracked file outside `.sdk/`, as another target owns its folder.

---

## The guarantee: every documented example is tested

Each generated target contains a `readme_examples` test that extracts **every**
code block from that language's docs (root `README.md`, `<lang>/README.md`,
`<lang>/REFERENCE.md`), type-checks / syntax-checks it, **executes** the
runnable ones in seeded offline test mode, and asserts completeness — a
documented example that doesn't compile or run fails the build. So if
`npm test` (etc.) is green, the code shown in your SDK's docs is verified,
not aspirational. Do not delete these tests.

---

## Shape gotchas (learned across 500+ real-world APIs)

The generator is model-driven and handles the awkward shapes real specs
produce; you mostly get these for free, but know they exist:

- **id-less entities** — some load matches carry no `id` (query-param loads, response-wrapped specs). Examples degrade to `load()` with no argument; don't hand-write `{ id: ... }`.
- **non-standard ops** — an entity may be create-only (`create`) or expose custom ops (`generate`, `delete`); examples use the entity's *actual* primary op, never a hardcoded `.load()`.
- **reserved-word entity names** — an entity named `Delete`/`Class`/etc. gets a safe example variable name in typed languages.
- **native field types** — docs show `string`/`number`/`str`/`int`, not the model's `$STRING`/`$INTEGER` sentinels.
- **`direct()` escape hatch** — for endpoints not modelled as entities; returns an envelope (`{ ok, status, headers, data }`), branch on `ok`.

If you customize the model and add your own examples, keep them **model-driven**
(derive field/op/type from the model) so the doc-example tests stay green.

---

## Publishing (once tests pass)

**PUBLISH OVER OIDC FROM CI, NEVER OVER A TOKEN FROM A WORKSTATION.** That
holds for this tool and for every SDK it generates.

### Releasing create-sdkgen itself

```bash
make publish V=x.y.z
```

Bumps, builds, tests, commits, pushes `main`, waits for the remote to show the
pushed SHA, then **dispatches** `.github/workflows/publish.yml`, which
publishes to npm over GitHub OIDC trusted publishing and writes the tag. By
hand, the same mechanism is
`gh workflow run publish.yml --ref main -f expect_sha=$(git rev-parse HEAD)`.

Never hand a release back as "run this locally yourself" — a release is a
dispatch, so prepare the commit and dispatch the workflow.

### Releasing a generated SDK

A generated project emits its own OIDC publish workflow per npm target
(`.github/workflows/publish-<target>.yml`), a maintainer guide at
`.sdk/PUBLISHING.md` that names the one-time `npm trust` command, and
`.sdk/admin/setup-npm-trust.sh`, which runs that command from the same model
and with `--check` reports any drift from it. Release by dispatching that
workflow; it publishes and cuts the release tag.

Only the FIRST version of a brand-new package goes out by hand: npm exposes
the trusted-publisher settings only once a version exists, so there is nothing
to register against until then. Run `.sdk/admin/setup-npm-trust.sh` straight
after, and every later release is a dispatch.

The non-npm ports (PyPI, Packagist, RubyGems, LuaRocks, Go modules) release by
per-target git tag (`<target>/vX.Y.Z`) through the generated root `Makefile`'s
`deploy-<target>` recipes, which inject credentials from the vault at exec
time rather than storing them.

---

## Prose follows STYLE-GUIDE.md

[`STYLE-GUIDE.md`](STYLE-GUIDE.md) is normative for the reader-facing page:
the root `README.md`. This file, `CONTRIBUTING.md`, and everything under
`project/` (scaffold copied into a generated SDK project) are outside it.
Two gates enforce it and both run in CI (`.github/workflows/docs.yml`):

| Gate | Checks |
|---|---|
| `vale --minAlertLevel=error $(python3 tools/check_prose.py --files)` | Google's rules plus the banned list, at the levels in `.vale.ini` |
| `python3 tools/check_prose.py` | the banned list across line wraps, em-dash spacing and ration, first person, no emoji, no citations of a working document, resolving relative links, a complete page set |

`make scan-prose` runs both (Vale where installed); `npm run scan-prose`
runs the check_prose half. Neither hangs off `npm test`, because the build
matrix includes Windows. The banned list is
`.vale/styles/config/vocabularies/CreateSdkgen/reject.txt`, read by both
gates. The page set is the configuration block at the top of
`tools/check_prose.py`; a new documentation page must be reachable from it
or neither gate reads it.

Three things trip agents most often: the README must not name or link
`AGENTS.md` or `CLAUDE.md` (state the fact instead; `CONTRIBUTING.md` is
fine to link); the em dash is spaced (` — `) and rationed to one aside per
line; and a word Vale's dictionary does not know goes into `accept.txt` one
entry at a time, never as a suffix pattern.

---

## Where to look next

| Need | Go to |
| --- | --- |
| Generator internals, customizing templates/components, adding a language | [sdkgen/AGENTS.md](https://github.com/voxgig/sdkgen/blob/main/AGENTS.md) + [sdkgen/docs/](https://github.com/voxgig/sdkgen/blob/main/docs/README.md) |
| How your OpenAPI becomes the model (the `def`/model shape) | [apidef/AGENTS.md](https://github.com/voxgig/apidef/blob/main/AGENTS.md) |
| Step-by-step first SDK (human tutorial) | [sdkgen/docs/tutorial.md](https://github.com/voxgig/sdkgen/blob/main/docs/tutorial.md) |
| Model schema, CLI flags, project layout, hooks | [sdkgen/docs/reference/](https://github.com/voxgig/sdkgen/tree/main/docs/reference/) |

---

## Quick sanity checklist for an agent

1. Have an OpenAPI 3 spec? → `create-sdkgen <name> -d <spec> -o <dir>`.
2. `cd <dir>/.sdk` → `target add <langs>` → `feature add test`.
3. `npm run generate` (builds `.sdk` sources, then runs the generator) → generates target dirs.
4. Run each target's tests → **all green** (incl. doc-example tests).
5. Shape the API? → edit `.sdk/model/entity/*.aontu`, regenerate, re-test — never edit generated output.
6. Release when green — by **dispatching** the generated OIDC publish
   workflow, never `npm publish` from a checkout. See Publishing above.

## Documentation editions

New projects include `@voxgig/docgen`. Installing the `.sdk` dependencies adds
the `summary` and `github-pages` editions. `npm run generate` then produces
`SUMMARY.md` and the static HTML site in `docs/`, with text QA and a GitHub
Pages workflow. With `--no-install`, setup happens when dependencies are installed.

Add the optional Slidev presentation from `.sdk`:

```sh
npx voxgig-sdkgen edition add presentation
npm run generate
```

Configure shared branding and each edition under `main.kit.doc` in the model.
Customise templates in `.sdk/tm/edition/` and add authored Markdown in
`.sdk/doc/content/`. SDK README generation remains a separate SDK phase.
The [docgen guide](https://github.com/voxgig/docgen) describes the model,
local assets, presentation builds, and Vale text QA.

## Source code comments

Follow [COMMENT-POLICY.md](COMMENT-POLICY.md): comments are sparse and terse,
only for intricate or surprising code. Names carry intent; documents carry
requirements. Run `make comments comments-test` after editing source.

Durable implementation rationale is in [COMMENT-NOTES.md](COMMENT-NOTES.md).

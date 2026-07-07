# AGENTS.md — build an SDK with @voxgig/sdkgen

This is the **starting point** for an AI agent (or human) building a new
multi-language client SDK from an OpenAPI spec, using the Voxgig SDK
Generator toolchain. `create-sdkgen` scaffolds the project; the rest of the
toolchain generates and tests the SDKs.

If you are here to **modify the generator itself** (templates, components,
language targets), you want [`@voxgig/sdkgen`'s AGENTS.md](https://github.com/voxgig/sdkgen/blob/main/AGENTS.md)
instead — this guide is about *consuming* the generator to produce an SDK.

---

## Mental model

One source of truth — a **model** — drives everything. You edit the model;
every SDK is regenerated from it.

```
OpenAPI 3 spec  ──apidef──▶  model (.sdk/model/*.aontu)  ──sdkgen──▶  ts/  py/  go/  php/  rb/  lua/  (+ go-cli, go-mcp)
   (your API)                (the source of truth you edit)             (generated SDK source — NEVER hand-edit)
```

- **`@voxgig/apidef`** parses your OpenAPI spec into the model (entities, ops, fields, types). See [apidef/AGENTS.md](https://github.com/voxgig/apidef/blob/main/AGENTS.md).
- **The model** (`.sdk/model/`, `.aontu` files, unified by `aontu`) is what you edit to shape the SDK.
- **`@voxgig/sdkgen`** renders the model into idiomatic per-language SDK source via `jostraca`. See [sdkgen/AGENTS.md](https://github.com/voxgig/sdkgen/blob/main/AGENTS.md).

The API surface is exposed as **semantic entities** (Capitalised — e.g.
`client.Advice()`), not raw URL paths. Each entity offers only the operations
it actually has, drawn from `list`, `load`, `create`, `update`, `remove`.

---

## Prerequisites

- Node.js (recent LTS).
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
`go-cli` and `go-mcp`. `target add` / `feature add` edit `.sdk/model/config.aontu`.

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
| `.sdk/model/sdk.aontu` | Model entry — name, spec ref (`def`), imports | Yes (rarely) |
| `.sdk/model/entity/*.aontu` | **Entities** — the semantic surface (ops, fields, types) | **Yes — this is the main lever** |
| `.sdk/model/config.aontu` | Active targets + features | Yes (or via `target add`/`feature add`) |
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

The generated per-language packages publish independently — npm (ts/js), PyPI
(py), Packagist (php), RubyGems (rb), LuaRocks (lua), and Go modules via git
tags. The reference fleet publishes with per-target git tags
(`<target>/vX.Y.Z`) pushed per repo; see the builder's tag-publish script
pattern if you want that flow. Standard `npm publish` / `twine` / etc. also
work on the generated packages.

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
6. Publish per-language packages when green.

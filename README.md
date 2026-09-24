# create-sdkgen

Scaffold a new **Voxgig SDK Generator** project — turn an OpenAPI spec into
idiomatic, tested, multi-language client SDKs (TypeScript, Python, Go, PHP,
Ruby, Lua, plus a CLI and MCP server).

## Quickstart

From a spec to a tested SDK, in four steps:

```sh
# 1. Scaffold a project from your OpenAPI 3 spec
create-sdkgen my-api -d ./openapi.yaml -o ./my-api-sdk

# 2. Add the languages you want + offline test mode
cd my-api-sdk/.sdk
npx voxgig-sdkgen target add ts py go
npx voxgig-sdkgen feature add test

# 3. Generate the SDKs (builds the .sdk sources, then runs the generator)
npm run generate

# 4. Verify
cd ../ts && npm install && npm run build && npm test
```

You shape the SDK by editing the **model** in `.sdk/model/` (entities, ops,
fields); everything under the language directories (`ts/`, `py/`, …) is
generated output and is overwritten on each regenerate.

## Options

| Flag | Meaning |
| --- | --- |
| `<name>` | SDK name (kebab-case), the package base name |
| `-d, --def <spec>` | OpenAPI 3 spec file (`.yaml`/`.json`) |
| `-o, --folder <dir>` | output directory (default `<name>-sdk`) |
| `-t, --target <langs>` | targets to add during scaffold (e.g. `ts,py,go`) |
| `-f, --feature <feats>` | features to add (e.g. `test`) |
| `--no-install` | skip `npm install` |
| `-h`, `-v` | help, version |

## After the scaffold

The loop from here is:

```
edit .sdk/model/entity/*.aontu  →  (cd .sdk && npm run generate)  →  re-run the target tests
```

Commit before regenerating, since generation overwrites the target
directories. Every generated target carries a `readme_examples` test that
extracts each code block from that language's `README.md` and `REFERENCE.md`,
compiles it, and runs the runnable ones in offline test mode, so a documented
example that does not work fails that target's build. When the tests are
green, publish each language package the way its ecosystem expects (npm, PyPI,
Packagist, RubyGems, LuaRocks, or a Go module tag).

The step-by-step tutorial, the model reference, and the generator's CLI flags
are in the [sdkgen documentation](https://github.com/voxgig/sdkgen/tree/main/docs).

## Re-scaffold an existing project

Run the same command over the project's output directory to pick up a newer
scaffold:

```sh
create-sdkgen my-api -d ./openapi.yaml -o ./my-api-sdk
```

A re-scaffold rewrites the scaffold's own files and keeps the project's: the
guide in `.sdk/model/guide/`, the project overlay `.sdk/model/project.aontu`,
and the target, feature, and edition indexes with the files they name.

The same command brings a project from before the `.aontu` rename up to date,
which it needs, because `aontu` now refuses to include a `.aon` file. The
re-scaffold renames each `.aon` file under `.sdk/model/` and `.sdk/test/` to
`.aontu`, or removes it where the scaffold writes its replacement, and updates
every include that names a renamed file. Nothing else in a file changes. An
include the scaffold can't update, such as one pointing outside `.sdk/`, gets
a warning that names the file. Commit first, so the migration is a diff you
can read. [`test/create-sdkgen.test.ts`](./test/create-sdkgen.test.ts) builds
such a project and re-scaffolds it.

## The toolchain

- **create-sdkgen** (this package) — scaffolds the project.
- **[@voxgig/apidef](https://github.com/voxgig/apidef)** — parses your OpenAPI spec into the model.
- **[@voxgig/sdkgen](https://github.com/voxgig/sdkgen)** — generates the SDKs from the model.

## Contributing

How to validate a change, and why a pull request from a fork gets no CI, are
in [`CONTRIBUTING.md`](./CONTRIBUTING.md). The documentation follows
[the style guide](./STYLE-GUIDE.md).

## Documentation editions

New projects include `@voxgig/docgen`. Installing the `.sdk` dependencies adds
the `summary` and `github-pages` editions. `npm run generate` then produces
`SUMMARY.md` and the static HTML site in `docs/`. It also adds text QA and a GitHub Pages workflow. With `--no-install`, setup happens when dependencies are installed.

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

## Repository administration

New projects include `.sdk/admin/status.sh`. Run it to review local repository,
SDK, and documentation status; add `--github` to read CI and Pages status through
`gh`. Docgen generates `.sdk/admin/setup-github-pages.sh` for Pages setup.
See the [administration reference](https://github.com/voxgig/sdkgen/blob/main/docs/reference/project-layout.md#repository-administration)
for script options and ownership.

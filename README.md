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

## The toolchain

- **create-sdkgen** (this package) — scaffolds the project.
- **[@voxgig/apidef](https://github.com/voxgig/apidef)** — parses your OpenAPI spec into the model.
- **[@voxgig/sdkgen](https://github.com/voxgig/sdkgen)** — generates the SDKs from the model.

## Contributing

How to validate a change, and why a pull request from a fork gets no CI, are
in [`CONTRIBUTING.md`](./CONTRIBUTING.md). The documentation follows
[the style guide](./STYLE-GUIDE.md).

# create-sdkgen

Scaffold a new **Voxgig SDK Generator** project — turn an OpenAPI spec into
idiomatic, tested, multi-language client SDKs (TypeScript, Python, Go, PHP,
Ruby, Lua, plus a CLI and MCP server).

## Quickstart

```sh
# 1. Scaffold a project from your OpenAPI 3 spec
create-sdkgen my-api -d ./openapi.yaml -o ./my-api-sdk

# 2. Add the languages you want + offline test mode
cd my-api-sdk/.sdk
npx voxgig-sdkgen target add ts py go
npx voxgig-sdkgen feature add test

# 3. Generate the SDKs
npx voxgig-model model/sdk.jsonic

# 4. Verify
cd ../ts && npm install && npm test
```

You shape the SDK by editing the **model** in `.sdk/model/` (entities, ops,
fields); everything under the language directories (`ts/`, `py/`, …) is
generated output and is overwritten on each regenerate.

## Options

| Flag | Meaning |
| --- | --- |
| `<name>` | SDK name (kebab-case), the package base name |
| `-d, --def <spec>` | OpenAPI 3 spec file (`.yaml`/`.json`) |
| `-o, --folder <dir>` | output directory |
| `-t, --target <langs>` | targets to add during scaffold (e.g. `ts,py,go`) |
| `-f, --feature <feats>` | features to add (e.g. `test`) |
| `--no-install` | skip `npm install` |
| `-h`, `-v` | help, version |

## Building an SDK with an AI agent?

Point your agent at **[`AGENTS.md`](./AGENTS.md)** — the full end-to-end guide
(spec → scaffold → generate → test → publish), what to edit vs. what is
generated, the doc-example test guarantee, and the real-world shape gotchas.

## The toolchain

- **create-sdkgen** (this package) — scaffolds the project.
- **[@voxgig/apidef](https://github.com/voxgig/apidef)** — parses your OpenAPI spec into the model.
- **[@voxgig/sdkgen](https://github.com/voxgig/sdkgen)** — generates the SDKs from the model.

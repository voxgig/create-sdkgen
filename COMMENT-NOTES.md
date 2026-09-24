# Implementation rationale

The guide overlay contains user-authored corrections and survives re-scaffolding. Toolchain-derived scaffold files can be refreshed, but replacing the guide would discard entity and operation customizations.

The target, feature and edition indexes survive re-scaffolding for the same reason: `target add`, `feature add` and docgen register their items there, and docgen bootstraps only once.

A re-scaffold is also how a project from the `.aon` era moves to `.aontu`, which is the only extension aontu reads. Under `.sdk/model/` and `.sdk/test/`, a `.aon` file whose `.aontu` twin the scaffold writes is removed, as the overwrite would have replaced it; every other `.aon` file is renamed with its bytes kept, unless its `.aontu` twin already exists, which wins. An include is rewritten only when the file it names will exist as `.aontu`: a `@voxgig/` package, a file the scaffold writes, apidef's base guide, or a file on disk under that name. What is left is reported as a warning, and nothing in the migration can fail the scaffold.

Dry runs must avoid filesystem writes, including creation of logging directories and log files.

Sources: [root scaffold](src/project/standard/CreateRoot.ts), [migration](src/project/standard/migrate.ts), [CLI](src/create-sdkgen.ts).

The shared model corpus records unsupported subjects as `basic.pending` values, with reasons stored in data. Keep those markers when editing comments; they distinguish a deferred subject from a silently empty suite.

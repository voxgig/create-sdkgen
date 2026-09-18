# Implementation rationale

The guide overlay contains user-authored corrections and survives re-scaffolding. Toolchain-derived scaffold files can be refreshed, but replacing the guide would discard entity and operation customizations.

Dry runs must avoid filesystem writes, including creation of logging directories and log files.

Sources: [root scaffold](src/project/standard/CreateRoot.ts), [CLI](src/create-sdkgen.ts).

The shared model corpus records unsupported subjects as `basic.pending` values, with reasons stored in data. Keep those markers when editing comments; they distinguish a deferred subject from a silently empty suite.

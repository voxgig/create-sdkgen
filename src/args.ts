/* Copyright (c) 2026 Richard Rodger, MIT License */


// The targets sdkgen and its language packages add.
const TARGETS = [
  'ts', 'js', 'py', 'py-data', 'go', 'go-cli', 'go-mcp', 'rb', 'php', 'lua',
  'csharp', 'java', 'kotlin', 'scala', 'swift', 'dart', 'rust', 'c', 'cpp',
  'zig', 'perl', 'clojure', 'elixir', 'ocaml', 'haskell', 'lean',
]

// `npm create` reads these as its own configuration, and records them in the
// environment, when no `--` precedes them.
const NPM_KEPT_FLAGS: Record<string, string> = {
  dryrun: '--dryrun',
  install: '--no-install',
}


type Env = Record<string, string | undefined>


// `npm create <name> -d spec.yaml -t ts` hands the initializer
// `<name> spec.yaml ts`: npm keeps each flag and passes its value on.
function forwardingError(name: string, positionalTargets: string[], env: Env):
  string | undefined {
  const notTargets = positionalTargets
    .flatMap((arg: string) => arg.split(','))
    .filter((arg: string) => '' !== arg && !TARGETS.includes(arg))

  const kept = Object.keys(NPM_KEPT_FLAGS)
    .filter((key: string) => undefined !== env['npm_config_' + key])
    .map((key: string) => NPM_KEPT_FLAGS[key])

  if (0 === notTargets.length && 0 === kept.length) {
    return undefined
  }

  return [
    0 < notTargets.length ? 'Not a target: ' + notTargets.join(', ') + '.' : '',
    0 < kept.length ? 'npm kept ' + kept.join(' and ') + ' for itself.' : '',
    'npm create passes options on only after a --, as in:',
    '  npm create @voxgig/sdkgen@latest ' + (name || '<name>') +
    ' -- -d ./openapi.yaml -t ts',
    'Targets: ' + TARGETS.join(', ') + '. Add any other with -t.',
  ].filter(Boolean).join('\n')
}


export {
  TARGETS,
  forwardingError,
}

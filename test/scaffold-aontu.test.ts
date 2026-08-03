/* Copyright (c) 2024-2025 Richard Rodger, MIT License */

// Aontu comments are `#` only. The npm engine's jsonic parser also enables
// `//` and `/* */`, but @voxgig/model - the thing that actually compiles these
// files - switches those off so the TypeScript and Go engines reject the same
// sources. A scaffolded `//` line therefore parses fine here and blows up in
// the user's project on the very first `voxgig-model` run, which is how
// .model-config/model-config.aontu shipped with a commented-out `docgen`
// action written `// docgen: ...` while its neighbours used `#`.
//
// The obvious guard - compile every scaffolded model - is not available: the
// files carrying imports (`@"@voxgig/model/..."`, `@"@voxgig/apidef/..."`) are
// exactly the ones that need packages this repo does not depend on. So check
// the syntax textually instead. It costs nothing and catches the whole class.

import { test, describe } from 'node:test'
import assert from 'node:assert'

import * as Fs from 'node:fs'
import Path from 'node:path'


const STANDARD = Path.resolve(__dirname, '..', 'project', 'standard')


function aontuFiles(dir: string): string[] {
  return Fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? aontuFiles(Path.join(dir, e.name)) :
      e.name.endsWith('.aontu') ? [Path.join(dir, e.name)] : [])
}


// Blank out quoted spans before looking for comment markers, so a `//` inside
// a string - a url, or the `comment: line: '//'` a target model legitimately
// declares for a C-family language - is not mistaken for a comment.
function unquoted(line: string): string {
  return line.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '')
}


describe('scaffold-aontu-syntax', () => {

  const files = aontuFiles(STANDARD)

  // A miswired path would make the test vacuously pass.
  test('the scaffold has model files to check', () => {
    assert.ok(0 < files.length, `no .aontu files under ${STANDARD}`)
  })

  test('no scaffolded model uses a slash comment', () => {
    const bad: string[] = []

    for (const file of files) {
      const rel = Path.relative(STANDARD, file)
      Fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (/(^|\s)(\/\/|\/\*)/.test(unquoted(line))) {
          bad.push(`${rel}:${i + 1}: ${line.trim()}`)
        }
      })
    }

    assert.deepEqual(
      bad, [],
      'aontu accepts `#` comments only - these lines would fail to parse ' +
      'in a scaffolded project:\n  ' + bad.join('\n  '))
  })

})

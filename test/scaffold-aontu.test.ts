/* Copyright (c) 2024-2025 Richard Rodger, MIT License */


import { test, describe } from 'node:test'
import assert from 'node:assert'

import * as Fs from 'node:fs'
import Path from 'node:path'


const STANDARD = Path.resolve(__dirname, '..', 'project', 'standard')


function aontuFiles(dir: string): string[] {
  return Fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? aontuFiles(Path.join(dir, e.name)) :
      /\.aon(?:tu)?$/.test(e.name) ? [Path.join(dir, e.name)] : [])
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
    assert.ok(0 < files.length, `no model files under ${STANDARD}`)
    assert.ok(files.some((file) => file.endsWith('.aontu')),
      `no .aontu files under ${STANDARD}`)
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

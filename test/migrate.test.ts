/* Copyright (c) 2026 Richard Rodger, MIT License */


import Fs from 'node:fs'
import Os from 'node:os'
import Path from 'node:path'
import { describe, test } from 'node:test'
import { equal, ok } from 'node:assert'

import { migrateToAontu, rewriteIncludes } from '../dist/project/standard/migrate'


describe('rewrite-includes', () => {

  const all = (src: string) => rewriteIncludes(src, () => true)

  test('renames an include in each quote style, spacing kept', () => {
    equal(all('@"./a.aon"\n'), '@"./a.aontu"\n')
    equal(all("@'./a.aon'\n"), "@'./a.aontu'\n")
    equal(all('@`./a.aon`\n'), '@`./a.aontu`\n')
    equal(all('@ "./a.aon"\n'), '@ "./a.aontu"\n')
    equal(all('feature: cost: @"./cost.aon"  # one case\n'),
      'feature: cost: @"./cost.aontu"  # one case\n')
  })

  test('leaves a comment and string data alone', () => {
    for (const src of [
      '# @"./a.aon"\n',
      'x: 1  # @"./a.aon"\n',
      "note: '@\"./a.aon\"'\n",
      'note: "@\'./a.aon\'"\n',
      'note: `\n@"./a.aon"\n`\n',
      'path: "./a.aon"\n',
    ]) {
      equal(all(src), src)
    }
  })

  test('renames only what the caller says has moved', () => {
    equal(rewriteIncludes('@"./a.aon"\n@"./b.aon"\n', (path) => './a.aon' === path),
      '@"./a.aontu"\n@"./b.aon"\n')
  })

  test('leaves an include already named .aontu, or of another kind, alone', () => {
    for (const src of ['@"./a.aontu"\n', '@"./a.json"\n', '@"./a"\n']) {
      equal(all(src), src)
    }
  })
})


describe('migrate-to-aontu', () => {

  const none = { kept: new Set<string>(), replaced: new Set<string>() }
  const body = 'x: 1\n'.repeat(20)

  function project(files: Record<string, string>): string {
    const sdk = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'migrate-'))
    for (const [rel, text] of Object.entries(files)) {
      Fs.mkdirSync(Path.dirname(Path.join(sdk, rel)), { recursive: true })
      Fs.writeFileSync(Path.join(sdk, rel), text)
    }
    return sdk
  }

  const read = (sdk: string, rel: string) => Fs.readFileSync(Path.join(sdk, rel), 'utf8')

  const leftovers = (sdk: string) => (Fs.readdirSync(sdk, { recursive: true }) as string[])
    .filter((rel) => rel.endsWith('.migrating'))

  // A disk that fills mid-write: half the bytes land, then the write fails.
  const filling = {
    ...Fs,
    writeFileSync: (path: any, data: any) => {
      const text = String(data)
      Fs.writeFileSync(path, text.slice(0, Math.floor(text.length / 2)))
      throw new Error('ENOSPC: no space left on device')
    },
  }

  test('a rewrite that fails part way leaves the model file whole', () => {
    const src = '@"./shared.aon"\n' + body
    const sdk = project({ 'model/project.aontu': src, 'model/shared.aontu': 'y: 2\n' })
    try {
      migrateToAontu(filling, sdk, none, () => { })
      equal(read(sdk, 'model/project.aontu'), src)
      equal(leftovers(sdk).length, 0)
    }
    finally {
      Fs.rmSync(sdk, { recursive: true, force: true })
    }
  })

  test('a rename that fails part way keeps the .aon original, and nothing else', () => {
    const sdk = project({ 'model/mine.aon': body })
    try {
      migrateToAontu(filling, sdk, none, () => { })
      equal(read(sdk, 'model/mine.aon'), body)
      ok(!Fs.existsSync(Path.join(sdk, 'model/mine.aontu')))
      equal(leftovers(sdk).length, 0)
    }
    finally {
      Fs.rmSync(sdk, { recursive: true, force: true })
    }
  })

  test('only the base guide apidef writes is renamed before it exists', () => {
    const sdk = project({
      'model/project.aontu':
        '@"../../outside/x-base-guide.aon"\n@"./guide/x-base-guide.aon"\n',
    })
    const notes: string[] = []
    try {
      migrateToAontu(Fs, sdk, none, (_file: string, note: string) => notes.push(note))
      equal(read(sdk, 'model/project.aontu'),
        '@"../../outside/x-base-guide.aon"\n@"./guide/x-base-guide.aontu"\n')
      ok(notes.some((n) => n.includes('outside/x-base-guide.aon')), notes.join('\n'))
    }
    finally {
      Fs.rmSync(sdk, { recursive: true, force: true })
    }
  })
})

/* Copyright (c) 2026 Richard Rodger, MIT License */


import { describe, test } from 'node:test'
import { equal } from 'node:assert'

import { rewriteIncludes } from '../dist/project/standard/migrate'


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

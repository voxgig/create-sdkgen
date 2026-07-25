/* Copyright (c) 2024-2025 Richard Rodger, MIT License */

// Guards on the SHARED TEST CORPUS this package owns.
//
// project/standard/.sdk/test/primary/*.aontu are language-neutral fixtures
// that compile into the test.json every generated SDK's own suite executes.
// They are the only mechanism proving that 22 language targets behave
// identically, which makes two failure modes expensive:
//
//   1. A fixture that compiles to an EMPTY `set`. Runners iterate the set, so
//      zero cases means the section reports PASS while asserting nothing.
//      Eight fixtures shipped like that — including preparePath, the path
//      templating step — and nothing flagged it.
//   2. A fixture that is not registered in primary-test-index.aontu, so it is
//      never compiled into test.json at all.
//
// An intentionally-deferred section is fine; a silently-blank one is not. The
// difference is the PENDING marker asserted below.

import { test, describe } from 'node:test'
import assert from 'node:assert'

import * as Fs from 'node:fs'
import Path from 'node:path'

import { Aontu } from 'aontu'


const PRIMARY = Path.resolve(
  __dirname, '..', 'project', 'standard', '.sdk', 'test', 'primary')

const INDEX = Path.join(PRIMARY, 'primary-test-index.aontu')

const CI = Path.resolve(
  __dirname, '..', 'project', 'standard', '.github', 'workflows', 'ci.yml')


// Sections deliberately empty. Each MUST carry a PENDING header explaining
// why, so the gap is reviewable rather than accidental. Keep in step with the
// PENDING lists in the language runners (tm/go/test/runner_test.go,
// tm/ts/test/utility/PrimaryUtility.test.ts, tm/rust/tests/common/mod.rs).
const PENDING = [
  'fetcher', 'makeFetchDef', 'makePoint', 'makeResult',
  'featureAdd', 'featureHook', 'featureInit',
]


function fixtureNames(): string[] {
  return Fs.readdirSync(PRIMARY)
    .filter((f) => f.endsWith('.aontu') && 'primary-test-index.aontu' !== f)
    .map((f) => f.replace(/\.aontu$/, ''))
    .sort()
}


function compile(name: string): any {
  const p = Path.join(PRIMARY, name + '.aontu')
  const errs: any[] = []
  const model: any = new Aontu().generate(Fs.readFileSync(p, 'utf8'), { path: p, errs })
  assert.equal(errs.length, 0,
    `${name}.aontu: ${errs.map((e: any) => `[${e.why}] ${e.msg}`).join(' | ')}`)
  return model
}


describe('shared test corpus', () => {

  test('every fixture compiles and declares basic.set', () => {
    for (const name of fixtureNames()) {
      const m = compile(name)
      assert.ok(m?.basic, `${name}: no 'basic' section`)
      assert.ok(Array.isArray(m.basic.set), `${name}: basic.set is not a list`)
    }
  })


  test('no fixture is silently empty', () => {
    // An empty set runs ZERO cases in every language runner. That is only
    // acceptable when declared, because a runner cannot tell "deferred" from
    // "accidentally blanked".
    const empty = fixtureNames().filter((n) => 0 === compile(n).basic.set.length)
    const undeclared = empty.filter((n) => !PENDING.includes(n))
    assert.deepEqual(undeclared, [],
      'these fixtures compile to zero cases — add cases, or add a PENDING ' +
      'header and list them in PENDING here and in the language runners')
  })


  test('every PENDING fixture explains itself', () => {
    for (const name of PENDING) {
      const src = Fs.readFileSync(Path.join(PRIMARY, name + '.aontu'), 'utf8')
      assert.match(src, /PENDING/,
        `${name}.aontu is deliberately empty but carries no PENDING note`)
      assert.ok(src.split('\n').filter((l) => l.trim().startsWith('#')).length > 2,
        `${name}.aontu: PENDING needs a reason, not just a marker`)
    }
  })


  test('a PENDING entry that gained cases is promoted', () => {
    const stale = PENDING.filter((n) => 0 < compile(n).basic.set.length)
    assert.deepEqual(stale, [],
      'these fixtures now have cases — remove them from PENDING here and in ' +
      'the language runners so an accidental re-blanking fails again')
  })


  test('every fixture is registered in the index', () => {
    const index = Fs.readFileSync(INDEX, 'utf8')
    for (const name of fixtureNames()) {
      assert.match(index, new RegExp(`@"${name}\\.aontu"`),
        `primary-test-index.aontu missing @"${name}.aontu" — the fixture ` +
        `would never reach test.json`)
    }
  })


  test('the index registers nothing that does not exist', () => {
    const index = Fs.readFileSync(INDEX, 'utf8')
    const referenced = [...index.matchAll(/@"([\w.-]+)\.aontu"/g)].map((m) => m[1])
    const missing = referenced.filter((n) => !fixtureNames().includes(n))
    assert.deepEqual(missing, [], 'index references fixtures that do not exist')
  })


  test('preparePath is covered — it is the riskiest shaping step', () => {
    // Regression pin: this shipped as `set: []` while go/py/rust/csharp each
    // kept private hand-written cases that had drifted apart.
    const set = compile('preparePath').basic.set
    assert.ok(3 <= set.length, 'preparePath needs real cases')
    const outs = set.map((e: any) => e.out)
    assert.ok(outs.includes('a/b'), 'blank segments must collapse, not double the separator')
  })
})


describe('generated-SDK CI covers every target', () => {

  // Every language target sdkgen can add. A target with no CI job is
  // generated into consumer repos and never compiled there.
  const TARGETS = [
    'go', 'go-cli', 'go-mcp', 'ts', 'js', 'py', 'rb', 'php', 'lua',
    'csharp', 'java', 'kotlin', 'scala', 'swift', 'dart', 'rust', 'c', 'cpp',
    'zig', 'perl', 'clojure', 'elixir', 'ocaml', 'haskell',
  ]

  test('each target has a job', () => {
    const ci = Fs.readFileSync(CI, 'utf8')
    const jobs = [...ci.matchAll(/^ {2}([\w-]+):$/gm)].map((m) => m[1])
    const missing = TARGETS.filter((t) => !jobs.includes(t))
    assert.deepEqual(missing, [],
      'these targets are generated but never built or tested in a consumer ' +
      'repo — add a job to project/standard/.github/workflows/ci.yml')
  })

  test('the advisory tier is documented, not implicit', () => {
    const ci = Fs.readFileSync(CI, 'utf8')
    assert.match(ci, /COVERAGE TIERS/,
      'continue-on-error jobs must be explained, or a permanently-red ' +
      'advisory job becomes an invisible blind spot')
  })
})

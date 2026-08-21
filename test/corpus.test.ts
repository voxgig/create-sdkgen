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
// difference is the deferral marker asserted below.
//
// That marker is DATA (`basic: pending: '<reason>'`), not a comment. Comments
// do not survive compilation to test.json, so a marker written only in the
// .aontu source cannot be checked by the runners that consume the corpus —
// which is how seven sections stayed blank in a generated SDK while its own
// suite reported green.

import { test, describe } from 'node:test'
import assert from 'node:assert'

import * as Fs from 'node:fs'
import Path from 'node:path'

import { Aontu } from 'aontu'


const PRIMARY = Path.resolve(
  __dirname, '..', 'project', 'standard', '.sdk', 'test', 'primary')

const INDEX = Path.join(PRIMARY, 'primary-test-index.aontu')

// The COMPILED corpus every generated SDK actually executes. It is a
// committed artefact produced by `npm run test-model`, so it can silently
// fall behind the .aontu sources it is built from — which is exactly what
// happened: preparePath's fixture and test.json disagreed and no test knew.
const TEST_JSON = Path.resolve(
  __dirname, '..', 'project', 'standard', '.sdk', 'test', 'test.json')

const CI = Path.resolve(
  __dirname, '..', 'project', 'standard', '.github', 'workflows', 'ci.yml')


// Sections deliberately empty. Each MUST carry a `basic: pending` reason, so
// the gap is reviewable rather than accidental. Keep in step with the PENDING
// lists in the language runners (tm/go/test/runner_test.go,
// tm/ts/test/utility/PrimaryUtility.test.ts, tm/rust/tests/common/mod.rs).
//
// makePoint is NOT here any more. Its note claimed it needed "an op with
// points plus SDK options.allow.op, i.e. a real client"; it does not. Context
// rebuilds `op` from opname + entity + config.entity.<n>.op.<n>.points, and
// `options` can be supplied literally, so all seven branches are expressible
// as data. It now carries real cases.
const PENDING = [
  'fetcher', 'makeFetchDef', 'makeResult',
  'featureAdd', 'featureHook', 'featureInit',
]


function fixtureNames(): string[] {
  return Fs.readdirSync(PRIMARY)
    .filter((f) => f.endsWith('.aontu') && 'primary-test-index.aontu' !== f)
    .map((f) => f.replace(/\.aontu$/, ''))
    .sort()
}


// Deep copy with object keys sorted, array order preserved. aontu and the
// model builder agree on the DATA but not on key order, so a raw deep-equal
// would report 14 sections as drifted when nothing has changed.
function canonical(v: any): any {
  if (Array.isArray(v)) {
    return v.map(canonical)
  }
  if (null != v && 'object' === typeof v) {
    return Object.fromEntries(
      Object.keys(v).sort().map((k) => [k, canonical(v[k])]))
  }
  return v
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


  test('every PENDING fixture explains itself, in data', () => {
    // Checked on the COMPILED fixture, not the source text: the reason has to
    // reach test.json, or the runners executing the corpus cannot see it.
    for (const name of PENDING) {
      const pending = compile(name).basic.pending
      assert.equal(typeof pending, 'string',
        `${name}.aontu is deliberately empty but declares no ` +
        `\`basic: pending\` reason — a comment alone does not reach test.json`)
      assert.ok(20 < pending.length,
        `${name}.aontu: pending needs a reason, not just a marker`)
    }
  })


  test('the PENDING list and the fixtures agree', () => {
    // Two places state which sections are deferred: this list (mirrored into
    // the language runners) and the fixtures themselves. If they drift, one of
    // them is lying — and the runners follow the list, not the fixture.
    const declared = [...PENDING].sort()
    const marked = fixtureNames()
      .filter((n) => 'string' === typeof compile(n).basic.pending)
      .sort()
    assert.deepEqual(marked, declared,
      'a fixture carries `basic: pending` without being listed in PENDING ' +
      '(or vice versa) — update both, and the language runners')
  })


  test('a PENDING entry that gained cases is promoted', () => {
    const stale = PENDING.filter((n) => 0 < compile(n).basic.set.length)
    assert.deepEqual(stale, [],
      'these fixtures now have cases — remove them from PENDING here and in ' +
      'the language runners so an accidental re-blanking fails again')
  })


  test('makePoint is covered — it selects the endpoint every call uses', () => {
    // Regression pin, in the same spirit as preparePath below: this shipped as
    // `set: []` behind a deferral note that was simply wrong.
    const set = compile('makePoint').basic.set
    assert.ok(5 <= set.length, 'makePoint needs its branches covered')
    const codes = set
      .map((e: any) => e.match?.out?.code)
      .filter((c: any) => null != c)
    for (const code of ['point_op_allow', 'point_no_points', 'point_action_invalid']) {
      assert.ok(codes.includes(code),
        `makePoint: the ${code} branch is not asserted`)
    }
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


  test('the compiled test.json matches its .aontu sources', () => {
    // Generated SDKs execute test.json, NOT the fixtures. An edited fixture
    // that was never recompiled changes nothing for any target.
    //
    // Compare CONTENT, not just case counts: correcting one expected value in
    // an existing case — the most likely edit — leaves the count identical, so
    // a length check would pass while every target still asserted the old
    // value. That is the same "green while checking nothing" failure this
    // suite exists to prevent.
    //
    // Comparison is canonical (object keys sorted, array order preserved):
    // aontu and the model builder emit the same data with different key
    // ordering, which is not drift.
    const compiled = JSON.parse(Fs.readFileSync(TEST_JSON, 'utf8'))
    assert.ok(compiled?.primary, 'test.json has no primary section')

    const drift: string[] = []
    for (const name of fixtureNames()) {
      const want = canonical(compile(name).basic)
      const got = canonical(compiled.primary?.[name]?.basic)
      if (JSON.stringify(want) !== JSON.stringify(got)) {
        const wn = want?.set?.length
        const gn = got?.set?.length
        drift.push(wn === gn
          ? `${name}: ${wn} case(s) both sides, but the case DATA differs`
          : `${name}: fixture has ${wn} case(s), test.json has ${gn}`)
      }
    }
    assert.deepEqual(drift, [],
      'test.json is out of date — run `npm run test-model` in a scaffolded ' +
      'project and copy the result back, patching only the changed sections')
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

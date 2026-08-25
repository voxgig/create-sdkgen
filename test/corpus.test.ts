/* Copyright (c) 2024-2025 Richard Rodger, MIT License */

// Guards on the SHARED TEST CORPUS this package owns.
//
// project/standard/.sdk/test/primary/*.aon are language-neutral fixtures
// that compile into the test.json every generated SDK's own suite executes.
// They are the only mechanism proving that 22 language targets behave
// identically, which makes two failure modes expensive:
//
//   1. A fixture that compiles to an EMPTY `set`. Runners iterate the set, so
//      zero cases means the section reports PASS while asserting nothing.
//      Eight fixtures shipped like that — including preparePath, the path
//      templating step — and nothing flagged it.
//   2. A fixture that is not registered in primary-test-index.aon, so it is
//      never compiled into test.json at all.
//
// An intentionally-deferred section is fine; a silently-blank one is not. The
// difference is the deferral marker asserted below.
//
// That marker is DATA (`basic: pending: '<reason>'`), not a comment. Comments
// do not survive compilation to test.json, so a marker written only in the
// .aon source cannot be checked by the runners that consume the corpus —
// which is how seven sections stayed blank in a generated SDK while its own
// suite reported green.

import { test, describe } from 'node:test'
import assert from 'node:assert'

import * as Fs from 'node:fs'
import Path from 'node:path'

import { Aontu } from 'aontu'


const PRIMARY = Path.resolve(
  __dirname, '..', 'project', 'standard', '.sdk', 'test', 'primary')

const INDEX = Path.join(PRIMARY, 'primary-test-index.aon')

// The second corpus family: per-FEATURE behaviour cases. Same contract as
// primary/ — language-neutral data, compiled into the same test.json, run by
// each target against a REAL generated SDK — so the same guards apply. They
// are separate directories because the two answer different questions: a
// primary section pins one utility function, a feature section drives whole
// operations through a client with the feature active.
const FEATURE = Path.resolve(
  __dirname, '..', 'project', 'standard', '.sdk', 'test', 'feature')

const FEATURE_INDEX = Path.join(FEATURE, 'feature-test-index.aon')

// The COMPILED corpus every generated SDK actually executes. It is a
// committed artefact produced by `npm run test-model`, so it can silently
// fall behind the .aon sources it is built from — which is exactly what
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


// The fixtures in one corpus directory, index file excluded.
function namesIn(dir: string, index: string): string[] {
  return Fs.readdirSync(dir)
    .filter((f) => f.endsWith('.aon') && index !== f)
    .map((f) => f.replace(/\.aon$/, ''))
    .sort()
}


function fixtureNames(): string[] {
  return namesIn(PRIMARY, 'primary-test-index.aon')
}


function featureNames(): string[] {
  return namesIn(FEATURE, 'feature-test-index.aon')
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


function compileIn(dir: string, name: string): any {
  const p = Path.join(dir, name + '.aon')
  const errs: any[] = []
  const model: any = new Aontu().generate(Fs.readFileSync(p, 'utf8'), { path: p, errs })
  assert.equal(errs.length, 0,
    `${name}.aon: ${errs.map((e: any) => `[${e.why}] ${e.msg}`).join(' | ')}`)
  return model
}


function compile(name: string): any {
  return compileIn(PRIMARY, name)
}


function compileFeature(name: string): any {
  return compileIn(FEATURE, name)
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
        `${name}.aon is deliberately empty but declares no ` +
        `\`basic: pending\` reason — a comment alone does not reach test.json`)
      assert.ok(20 < pending.length,
        `${name}.aon: pending needs a reason, not just a marker`)
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
      assert.match(index, new RegExp(`@"${name}\\.aon"`),
        `primary-test-index.aon missing @"${name}.aon" — the fixture ` +
        `would never reach test.json`)
    }
  })


  test('the index registers nothing that does not exist', () => {
    const index = Fs.readFileSync(INDEX, 'utf8')
    const referenced = [...index.matchAll(/@"([\w.-]+)\.aon"/g)].map((m) => m[1])
    const missing = referenced.filter((n) => !fixtureNames().includes(n))
    assert.deepEqual(missing, [], 'index references fixtures that do not exist')
  })


  test('the compiled test.json matches its .aon sources', () => {
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


// The feature corpus. Same failure modes as primary/ — a section that
// compiles to zero cases, or a fixture the index never registers — with one
// extra of its own: a feature section is only run by an SDK that was
// GENERATED with that feature, so a section naming a feature no target
// implements would skip everywhere and report green forever.
describe('shared feature corpus', () => {

  test('every fixture compiles and declares basic.set', () => {
    for (const name of featureNames()) {
      const m = compileFeature(name)
      assert.ok(m?.basic, `${name}: no 'basic' section`)
      assert.ok(Array.isArray(m.basic.set), `${name}: basic.set is not a list`)
    }
  })


  test('no fixture is silently empty', () => {
    // Nothing is deferred here, so unlike primary/ there is no PENDING list:
    // a feature fixture exists because its feature has behaviour to pin.
    const empty = featureNames().filter((n) => 0 === compileFeature(n).basic.set.length)
    assert.deepEqual(empty, [],
      'these feature fixtures compile to zero cases — every language runner ' +
      'would report the section as passing while asserting nothing')
  })


  test('a `partial` note gives a real reason', () => {
    // `partial` marks a section that RUNS but leaves something to the
    // per-language suites (a callback option, say, which JSON cannot carry).
    // It is data, not a comment, for the same reason `basic: pending` is:
    // a comment never reaches test.json, so no consumer can see it.
    for (const name of featureNames()) {
      const partial = compileFeature(name).partial
      if (null == partial) { continue }
      assert.equal(typeof partial, 'string', `${name}: partial must be a string`)
      assert.ok(20 < partial.length,
        `${name}.aon: partial needs a reason, not just a marker`)
    }
  })


  test('a section that runs does not also claim to be deferred', () => {
    // `basic: pending` means "this whole section is a hole". A section with
    // cases that carries it is lying, and the primary guards would excuse it.
    const stale = featureNames().filter((n) => {
      const basic = compileFeature(n).basic
      return null != basic.pending && 0 < basic.set.length
    })
    assert.deepEqual(stale, [],
      'these sections have cases and still carry `basic: pending` — use ' +
      '`partial` for a section that runs but defers part of its subject')
  })


  test('every fixture is registered in the index', () => {
    const index = Fs.readFileSync(FEATURE_INDEX, 'utf8')
    for (const name of featureNames()) {
      assert.match(index, new RegExp(`@"${name}\\.aon"`),
        `feature-test-index.aon missing @"${name}.aon" — the fixture would ` +
        `never reach test.json`)
    }
  })


  test('the index registers nothing that does not exist', () => {
    const index = Fs.readFileSync(FEATURE_INDEX, 'utf8')
    const referenced = [...index.matchAll(/@"([\w.-]+)\.aon"/g)].map((m) => m[1])
    const missing = referenced.filter((n) => !featureNames().includes(n))
    assert.deepEqual(missing, [], 'index references fixtures that do not exist')
  })


  test('the compiled test.json matches its .aon sources', () => {
    // Same reason as the primary check: generated SDKs execute test.json, not
    // the fixtures, so an uncompiled edit changes nothing for any target.
    //
    // Compared WHOLE, not just `.basic`. A feature section carries top-level
    // metadata the cases do not — `partial`, and whatever a later section
    // adds — and a `.basic`-only comparison lets that drift silently: the
    // fixture says one thing, every generated SDK reads another, and this
    // test still reports the compiled corpus as matching its sources.
    const compiled = JSON.parse(Fs.readFileSync(TEST_JSON, 'utf8'))
    assert.ok(compiled?.feature,
      'test.json has no feature section — is feature-test-index.aon included ' +
      'from test.aon?')

    const drift: string[] = []
    for (const name of featureNames()) {
      const wantWhole = compileFeature(name)
      const gotWhole = compiled.feature?.[name]
      if (JSON.stringify(canonical(wantWhole)) === JSON.stringify(canonical(gotWhole))) {
        continue
      }

      // Name what actually differs, so the failure says which edit was not
      // recompiled rather than just "they differ".
      const wn = wantWhole?.basic?.set?.length
      const gn = gotWhole?.basic?.set?.length
      const wkeys = Object.keys(wantWhole || {}).sort().join(',')
      const gkeys = Object.keys(gotWhole || {}).sort().join(',')

      if (wkeys !== gkeys) {
        drift.push(`${name}: fixture has keys [${wkeys}], test.json has [${gkeys}]`)
      }
      else if (wn !== gn) {
        drift.push(`${name}: fixture has ${wn} case(s), test.json has ${gn}`)
      }
      else if (JSON.stringify(canonical(wantWhole.basic)) !==
        JSON.stringify(canonical(gotWhole?.basic))) {
        drift.push(`${name}: ${wn} case(s) both sides, but the case DATA differs`)
      }
      else {
        drift.push(`${name}: the cases match, but the section METADATA differs`)
      }
    }
    assert.deepEqual(drift, [],
      'test.json is out of date — recompile the corpus and copy the result ' +
      'back, patching only the changed sections')
  })


  test('cost is covered — it is the case the corpus route was proved on', () => {
    // Regression pin, like makePoint and preparePath above. cost is the only
    // feature using BOTH seams (it wraps the transport AND hooks the
    // pipeline), so its cases are what keep the two halves honest.
    const set = compileFeature('cost').basic.set
    assert.ok(10 <= set.length, 'cost needs its branches covered')

    const names = set.map((e: any) => String(e.name || ''))
    for (const [what, re] of [
      ['the budget deny path', /deny/],
      ['per-attempt charging under retry', /retry attempt/],
      ['ordering against the cache', /cache/],
      ['per-actor attribution', /actor/],
    ] as [string, RegExp][]) {
      assert.ok(names.some((n: string) => re.test(n)),
        `cost: ${what} is not asserted`)
    }

    // Every case must actually drive an operation, or it asserts the record's
    // initial state and nothing else.
    for (const e of set) {
      assert.ok(Array.isArray(e.op) && 0 < e.op.length,
        `cost: case "${e.name}" runs no operation`)
      assert.ok(null != e.out, `cost: case "${e.name}" asserts nothing`)
    }
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

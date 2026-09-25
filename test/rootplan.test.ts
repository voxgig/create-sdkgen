/* Copyright (c) 2026 Richard Rodger, MIT License */


import Fs from 'node:fs'
import Module from 'node:module'
import Path from 'node:path'
import { before, describe, test } from 'node:test'
import { deepEqual, equal, match, ok, throws } from 'node:assert'


const SRC = Path.resolve(__dirname, '..', 'project', 'standard', '.sdk', 'src')

let rootPlan: (kit: any, Fail?: new (message: string) => Error) => any


// The scaffold compiles only inside a generated project, so RootPlan.ts is
// loaded from source with its types stripped.
before(async () => {
  const source = Fs.readFileSync(Path.join(SRC, 'RootPlan.ts'), 'utf8')
  const js = (Module as any).stripTypeScriptTypes(source)
  const mod = await import(
    'data:text/javascript;base64,' + Buffer.from(js).toString('base64'))
  rootPlan = mod.rootPlan
})


const targets = (...names: string[]) =>
  Object.fromEntries(names.map((name: string) => [name, { name }]))


describe('root-plan', () => {

  test('every target in its own folder, and the repository files, by default', () => {
    deepEqual(rootPlan({ target: targets('ts', 'go', 'py') }), {
      top: true,
      build: true,
      place: { go: 'folder', py: 'folder', ts: 'folder' },
    })
  })


  test('an inactive target is not generated', () => {
    const plan = rootPlan({
      target: { ...targets('go'), ts: { name: 'ts', active: false } },
    })
    deepEqual(plan.place, { go: 'folder' })
  })


  test('the top and build phases switch off independently', () => {
    const top = rootPlan({ phase: { top: { active: false } }, target: {} })
    equal(top.top, false)
    equal(top.build, true)

    const build = rootPlan({ phase: { build: { active: false } }, target: {} })
    equal(build.top, true)
    equal(build.build, false)
  })


  test('a target can be generated at the project root', () => {
    const plan = rootPlan({
      phase: { top: { active: false }, build: { active: false } },
      target: {
        ts: { name: 'ts', active: false },
        'seneca-provider': { name: 'seneca-provider', output: { root: true } },
      },
    })
    deepEqual(plan, {
      top: false,
      build: false,
      place: { 'seneca-provider': 'root' },
    })
  })


  test('only one target can take the project root', () => {
    throws(() => rootPlan({
      phase: { top: { active: false } },
      target: {
        a: { name: 'a', output: { root: true } },
        b: { name: 'b', output: { root: true } },
      },
    }), /Only one target .* 2 declare `output: root: true`: a, b\./)
  })


  test('a root target needs the repository files switched off', () => {
    throws(() => rootPlan({
      target: { p: { name: 'p', output: { root: true } } },
    }), /main: kit: phase: top: active: false/)
  })


  test('an inactive target does not claim the root', () => {
    const plan = rootPlan({
      phase: { top: { active: false } },
      target: {
        a: { name: 'a', output: { root: true } },
        b: { name: 'b', active: false, output: { root: true } },
      },
    })
    deepEqual(plan.place, { a: 'root' })
  })


  test('a model without targets plans none', () => {
    deepEqual(rootPlan({}), { top: true, build: true, place: {} })
    deepEqual(rootPlan(undefined), { top: true, build: true, place: {} })
  })


  test('failures take the caller\'s error type', () => {
    class Refusal extends Error { }
    try {
      rootPlan({ target: { p: { name: 'p', output: { root: true } } } }, Refusal)
      ok(false, 'expected a refusal')
    }
    catch (err: any) {
      ok(err instanceof Refusal, 'not the caller\'s error type: ' + err)
    }
  })


  // A plan the standard Root does not consult would pass every test above.
  test('the standard Root renders through the plan', () => {
    const root = Fs.readFileSync(Path.join(SRC, 'Root.ts'), 'utf8')
    match(root, /import \{ rootPlan \} from '\.\/RootPlan'/)
    match(root, /rootPlan\(model\.main\[KIT\], SdkGenError\)/)
    match(root, /if \(plan\.top\) \{\s*Top\(\{\}\)/)
    match(root, /if \(plan\.build\) \{\s*BuildSDK\(\{\}\)/)
    match(root, /plan\.place\[key\]/)
  })

})

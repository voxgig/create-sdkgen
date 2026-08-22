/* Copyright (c) 2024-2025 Richard Rodger, MIT License */

import { test, describe, after } from 'node:test'
import assert from 'node:assert'

import * as Fs from 'node:fs'
import * as Os from 'node:os'
import Path from 'node:path'

import {
  CreateSdkGen
} from '../'


// All test artefacts live under one temp root, removed after the suite.
const TMP_ROOT = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'csdk-test-'))

const DEF_CONTENT =
  'openapi: 3.0.0\ninfo:\n  title: Pet Store\n  version: 1.0.0\npaths: {}\n'


after(() => {
  Fs.rmSync(TMP_ROOT, { recursive: true, force: true })
})


function tmpdir(label: string): string {
  return Fs.mkdtempSync(Path.join(TMP_ROOT, label + '-'))
}


// Recursively list files (relative, posix-style) under a folder.
function walk(dir: string, prefix = ''): string[] {
  if (!Fs.existsSync(dir)) {
    return []
  }
  return Fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? walk(Path.join(dir, e.name), prefix + e.name + '/')
      : [prefix + e.name])
}


// Scaffold a project into a fresh temp folder with npm install disabled, and
// return helpers to inspect the generated output. `def === undefined` writes a
// real def file; pass an explicit string (including '') to control def handling.
async function scaffold(over: any = {}): Promise<any> {
  const work = tmpdir('gen')
  const out = Path.join(work, 'out')
  const name = over.name ?? 'petstore'

  let def = over.def
  if (undefined === def) {
    def = Path.join(work, 'petstore.yml')
    Fs.writeFileSync(def, DEF_CONTENT)
  }

  const createSdkGen = CreateSdkGen({ debug: 'warn' })
  await createSdkGen.generate({
    root: 'CreateRoot',
    name,
    def,
    project: 'standard',
    folder: out,
    install: false,
    dryrun: !!over.dryrun,
  } as any)

  return {
    work,
    out,
    exists: (rel: string) => Fs.existsSync(Path.join(out, rel)),
    read: (rel: string) => Fs.readFileSync(Path.join(out, rel), 'utf8'),
    files: () => walk(out),
  }
}


describe('create-sdkgen', () => {

  test('happy', async () => {
    assert.equal(typeof CreateSdkGen, 'function')
  })


  test('factory-returns-generate', async () => {
    const csg = CreateSdkGen({ debug: 'warn' } as any)
    assert.equal(typeof csg, 'object')
    assert.equal(typeof csg.generate, 'function')
  })


  test('scaffold-core-files', async () => {
    const s = await scaffold()

    // Top-level project files + the .sdk generator project skeleton.
    for (const rel of [
      '.gitignore',
      '.github/workflows/ci.yml',
      '.sdk/.gitignore',
      '.sdk/package.json',
      '.sdk/model/sdk.aon',
      '.sdk/src/BuildSDK.ts',
      '.sdk/def/petstore.yml',
    ]) {
      assert.ok(s.exists(rel), 'missing generated file: ' + rel)
    }
  })


  test('excludes-fragment-templates', async () => {
    const s = await scaffold()
    const fragments = s.files().filter((f: string) => f.includes('.fragment.'))
    assert.deepEqual(fragments, [], 'fragment templates must not be copied verbatim')
  })


  test('gitignore-content', async () => {
    const s = await scaffold()

    const top = s.read('.gitignore')
    // Bare `node_modules` (NO trailing slash) so it also ignores node_modules
    // SYMLINKS (ts/node_modules -> shared tree); a dir-only rule left them tracked.
    assert.match(top, /^node_modules$/m)
    assert.doesNotMatch(top, /^node_modules\/$/m)
    assert.match(top, /\.DS_Store/)

    const sdk = s.read('.sdk/.gitignore')
    // Same guard for .sdk/node_modules -> shared tree symlink.
    assert.match(sdk, /^node_modules$/m)
    assert.match(sdk, /dist\//)
    assert.match(sdk, /\*\.tsbuildinfo/)
  })


  test('def-existing-is-copied-verbatim', async () => {
    const s = await scaffold()
    assert.ok(s.exists('.sdk/def/petstore.yml'))
    assert.equal(s.read('.sdk/def/petstore.yml'), DEF_CONTENT)
  })


  test('def-given-but-missing-throws', async () => {
    // A given --def must resolve; omitting it (see
    // def-empty-defaults-to-name-openapi3) legitimately gets a placeholder.
    const badPath = Path.join(TMP_ROOT, 'does-not-exist.yml')
    await assert.rejects(
      () => scaffold({ def: badPath }),
      /OpenAPI definition file not found/,
    )
  })


  test('def-empty-defaults-to-name-openapi3', async () => {
    // def '' -> spec.def defaults to `${name}-openapi3.yml`.
    const s = await scaffold({ name: 'petstore', def: '' })
    assert.ok(
      s.exists('.sdk/def/petstore-openapi3.yml'),
      'expected defaulted def filename in .sdk/def/')
  })


  test('sdk-aontu-substitutes-name-and-def', async () => {
    const s = await scaffold({ name: 'petstore' })
    const sdk = s.read('.sdk/model/sdk.aon')

    // Fragment placeholders NAME/DEF are replaced with the real values.
    assert.match(sdk, /name:\s*'petstore'/)
    assert.match(sdk, /def:\s*'petstore\.yml'/)

    // No unreplaced placeholder tokens remain.
    assert.doesNotMatch(sdk, /'NAME'/)
    assert.doesNotMatch(sdk, /'DEF'/)
  })


  test('sdk-package-json-substitutes-name', async () => {
    const s = await scaffold({ name: 'petstore' })
    const pkg = JSON.parse(s.read('.sdk/package.json'))

    // `$$const.name$$` etc. are replaced from the model.
    assert.equal(pkg.name, 'build-petstore-sdk')

    // No unresolved jostraca placeholders remain anywhere in the file.
    assert.doesNotMatch(s.read('.sdk/package.json'), /\$\$/)
  })


  test('dryrun-writes-no-scaffold', async () => {
    const s = await scaffold({ dryrun: true })
    // The scaffold itself is not written on a dry run.
    assert.equal(s.exists('.sdk/model/sdk.aon'), false)
    assert.equal(s.exists('.sdk/package.json'), false)
    assert.equal(s.exists('.gitignore'), false)
  })


  test('dryrun-writes-nothing-at-all', async () => {
    // Stronger than the per-file checks above, which a dry run could pass
    // while still touching the disk elsewhere: logCreate() used to mkdir
    // <folder>/.sdk/log and append create.log on EVERY run, dry or not.
    // Assert the whole output tree stays empty.
    const s = await scaffold({ dryrun: true })
    assert.deepEqual(s.files(), [],
      'a dry run must not create any file, including the create log')
  })


  test('logCreate-writes-create-log', async () => {
    const s = await scaffold()
    assert.ok(s.exists('.sdk/log/create.log'))
    assert.match(s.read('.sdk/log/create.log'), /CREATE/)
  })


  test('folder-defaults-append-sdk-suffix', async () => {
    const work = tmpdir('suffix')
    const def = Path.join(work, 'x.yml')
    Fs.writeFileSync(def, DEF_CONTENT)

    const orig = process.cwd()
    try {
      process.chdir(work)

      // Name without `-sdk` -> `<name>-sdk` folder.
      await CreateSdkGen({ debug: 'warn' } as any).generate({
        root: 'CreateRoot', name: 'alpha', def,
        project: 'standard', folder: '', install: false,
      } as any)
      assert.ok(
        Fs.existsSync(Path.join(work, 'alpha-sdk', '.sdk', 'model', 'sdk.aon')),
        'alpha -> alpha-sdk')

      // Name already ending `-sdk` -> not doubled.
      await CreateSdkGen({ debug: 'warn' } as any).generate({
        root: 'CreateRoot', name: 'beta-sdk', def,
        project: 'standard', folder: '', install: false,
      } as any)
      assert.ok(
        Fs.existsSync(Path.join(work, 'beta-sdk', '.sdk', 'model', 'sdk.aon')),
        'beta-sdk -> beta-sdk')
      assert.equal(
        Fs.existsSync(Path.join(work, 'beta-sdk-sdk')), false,
        'no double -sdk suffix')
    }
    finally {
      process.chdir(orig)
    }
  })

})


// The guide overlay is the one model file the USER owns — apidef unifies it
// over the heuristic classification, and it carries every documented
// customization (entity rename/hide/activate, param rename, ...). The blanket
// scaffold overwrite used to destroy it on every re-scaffold, and cedar-regen
// re-scaffolds on every regen, so the loss was silent and repeated.
describe('guide-overlay-merge', () => {

  const GUIDE_REL = Path.join('.sdk', 'model', 'guide', 'guide.aon')

  // Re-scaffold over an EXISTING project folder (the regen flow).
  async function rescaffold(out: string, def: string) {
    await CreateSdkGen({ debug: 'warn' } as any).generate({
      root: 'CreateRoot', name: 'petstore', def,
      project: 'standard', folder: out, install: false,
    } as any)
  }

  test('a fresh scaffold writes the guide template', async () => {
    const s = await scaffold()
    const guide = s.read(GUIDE_REL)
    assert.match(guide, /@"@voxgig\/apidef\/model\/guide\.aon"/)
    assert.match(guide, /@"base-guide\.aon"/)
  })

  test('a re-scaffold leaves a customized guide BYTE-IDENTICAL', async () => {
    const s = await scaffold()
    const guidePath = Path.join(s.out, GUIDE_REL)

    const customized = s.read(GUIDE_REL) +
      '\n# USER CUSTOMIZATION\nguide: entity: { widget: active: false }\n'
    Fs.writeFileSync(guidePath, customized)

    await rescaffold(s.out, Path.join(s.work, 'petstore.yml'))

    assert.equal(Fs.readFileSync(guidePath, 'utf8'), customized,
      'the user overlay must survive a re-scaffold untouched')
  })

  test('a re-scaffold restores includes the guide is missing, keeping user content', async () => {
    const s = await scaffold()
    const guidePath = Path.join(s.out, GUIDE_REL)

    // Includes deleted — the file no longer resolves the heuristic guide.
    const damaged = '# only my stuff\nguide: entity: { widget: active: false }\n'
    Fs.writeFileSync(guidePath, damaged)

    await rescaffold(s.out, Path.join(s.work, 'petstore.yml'))

    const merged = Fs.readFileSync(guidePath, 'utf8')
    assert.match(merged, /@"@voxgig\/apidef\/model\/guide\.aon"/)
    assert.match(merged, /@"base-guide\.aon"/)
    assert.match(merged, /guide: entity: \{ widget: active: false \}/)
    // Restored at the TOP: the overrides unify over base-guide, so the
    // includes have to precede them.
    assert.ok(
      merged.indexOf('@"base-guide.aon"') < merged.indexOf('# only my stuff'),
      'includes must be restored before the user content')
  })

  test('the rest of the scaffold is still overwritten', async () => {
    const s = await scaffold()
    const sdkAontu = Path.join(s.out, '.sdk', 'model', 'sdk.aon')

    Fs.writeFileSync(sdkAontu, '# clobbered\n')
    await rescaffold(s.out, Path.join(s.work, 'petstore.yml'))

    assert.notEqual(Fs.readFileSync(sdkAontu, 'utf8'), '# clobbered\n',
      'toolchain-derived files must still be overwritten so fixes propagate')
  })

})


// The project overlay is the second user-owned model file. It exists because
// the sdkgen schema directs projects to declare publication values in
// model/sdk.aon "where they survive a resync", and they did not: ModelSdk
// rewrites sdk.aon from its template on every scaffold. The cedar fleet ran
// with every manifest pinned at the schema default 0.0.1 while its tags
// climbed past 0.1.1, and nothing reported an error — which is why the
// preservation is asserted here rather than trusted.
describe('project-overlay', () => {

  const PROJECT_REL = Path.join('.sdk', 'model', 'project.aon')
  const SDK_REL = Path.join('.sdk', 'model', 'sdk.aon')

  async function rescaffold(out: string, def: string) {
    await CreateSdkGen({ debug: 'warn' } as any).generate({
      root: 'CreateRoot', name: 'petstore', def,
      project: 'standard', folder: out, install: false,
    } as any)
  }

  test('a fresh scaffold writes the stub, and sdk.aon includes it LAST', async () => {
    const s = await scaffold()
    assert.equal(s.exists(PROJECT_REL), true)

    const sdk = s.read(SDK_REL)
    assert.match(sdk, /@"project\.aon"/)

    // Order is load-bearing: a key under main.kit.target.<t> can only refine a
    // target that target-index.aon has already defined. Declared earlier the
    // model build dies on "key ext value was: nil".
    assert.ok(sdk.indexOf('@"project.aon"') >
      sdk.indexOf('@"target/target-index.aon"'),
      'project.aon must be included after target-index.aon')
  })

  test('a re-scaffold leaves a customized project overlay BYTE-IDENTICAL', async () => {
    const s = await scaffold()
    const projectPath = Path.join(s.out, PROJECT_REL)

    const customized = s.read(PROJECT_REL) +
      "\nmain: kit: target: ts: publish: version: '1.2.3'\n"
    Fs.writeFileSync(projectPath, customized)

    await rescaffold(s.out, Path.join(s.work, 'petstore.yml'))

    assert.equal(Fs.readFileSync(projectPath, 'utf8'), customized,
      'a declared release version must survive a re-scaffold')
  })

  test('sdk.aon itself is still template-owned, so a renamed def propagates', async () => {
    // The reason project.aon exists instead of merging sdk.aon: the
    // template owns `def`, and cedar renamed three spec files in one week. A
    // "keep the user's file" merge would pin def to a spec that is gone.
    const s = await scaffold()
    assert.match(s.read(SDK_REL), /def: 'petstore\.yml'/)

    const renamed = Path.join(s.work, 'petstore-v2-swagger-2.0.yml')
    Fs.writeFileSync(renamed, DEF_CONTENT)
    await rescaffold(s.out, renamed)

    assert.match(s.read(SDK_REL), /def: 'petstore-v2-swagger-2\.0\.yml'/)
  })
})


// The .aontu -> .aon rename is only safe because the two USER-OWNED overlays
// are migrated rather than abandoned. Both are read-if-present and
// written-if-absent, so a rename without migration does not rename anything —
// it leaves the user's file on disk, ignored, and writes a fresh template over
// the top. 660 generated repos carry a guide.aontu.
describe('overlay-extension-migration', () => {

  const GUIDE_AON = Path.join('.sdk', 'model', 'guide', 'guide.aon')
  const GUIDE_OLD = Path.join('.sdk', 'model', 'guide', 'guide.aontu')
  const PROJ_AON = Path.join('.sdk', 'model', 'project.aon')
  const PROJ_OLD = Path.join('.sdk', 'model', 'project.aontu')

  async function rescaffold(out: string, def: string) {
    await CreateSdkGen({ debug: 'warn' } as any).generate({
      root: 'CreateRoot', name: 'petstore', def,
      project: 'standard', folder: out, install: false,
    } as any)
  }

  test('a legacy guide.aontu is renamed, keeping its customizations', async () => {
    const s = await scaffold()
    const customized = s.read(GUIDE_AON) +
      '\n# USER CUSTOMIZATION\nguide: entity: { widget: active: false }\n'

    // Put the project back into its pre-rename shape.
    Fs.writeFileSync(Path.join(s.out, GUIDE_OLD), customized)
    Fs.rmSync(Path.join(s.out, GUIDE_AON))

    await rescaffold(s.out, Path.join(s.work, 'petstore.yml'))

    assert.equal(Fs.existsSync(Path.join(s.out, GUIDE_OLD)), false,
      'the legacy file must be gone, not left behind to be ignored')
    assert.equal(s.read(GUIDE_AON), customized,
      'the customizations must survive the rename byte-for-byte')
  })

  test('a legacy project.aontu is renamed, keeping the release version', async () => {
    const s = await scaffold()
    const declared = s.read(PROJ_AON) +
      "\nmain: kit: target: ts: publish: version: '1.2.3'\n"

    Fs.writeFileSync(Path.join(s.out, PROJ_OLD), declared)
    Fs.rmSync(Path.join(s.out, PROJ_AON))

    await rescaffold(s.out, Path.join(s.work, 'petstore.yml'))

    assert.equal(Fs.existsSync(Path.join(s.out, PROJ_OLD)), false)
    assert.match(s.read(PROJ_AON), /version: '1\.2\.3'/,
      'an ignored project overlay resets every manifest to 0.0.1')
  })

  test('migration is a no-op once the .aon file exists', async () => {
    const s = await scaffold()
    const before = s.read(GUIDE_AON)
    await rescaffold(s.out, Path.join(s.work, 'petstore.yml'))
    assert.equal(s.read(GUIDE_AON), before)
    assert.equal(Fs.existsSync(Path.join(s.out, GUIDE_OLD)), false)
  })
})

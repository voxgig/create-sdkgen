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
      '.sdk/model/sdk.jsonic',
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
    assert.match(top, /node_modules\//)
    assert.match(top, /\.DS_Store/)

    const sdk = s.read('.sdk/.gitignore')
    assert.match(sdk, /dist\//)
    assert.match(sdk, /\*\.tsbuildinfo/)
  })


  test('def-existing-is-copied-verbatim', async () => {
    const s = await scaffold()
    assert.ok(s.exists('.sdk/def/petstore.yml'))
    assert.equal(s.read('.sdk/def/petstore.yml'), DEF_CONTENT)
  })


  test('def-missing-writes-placeholder', async () => {
    // Absolute path that does not exist -> placeholder content, basename kept.
    const s = await scaffold({ def: Path.join(TMP_ROOT, 'does-not-exist.yml') })
    assert.ok(s.exists('.sdk/def/does-not-exist.yml'))
    assert.match(s.read('.sdk/def/does-not-exist.yml'), /# OpenAPI Definition/)
  })


  test('def-empty-defaults-to-name-openapi3', async () => {
    // def '' -> spec.def defaults to `${name}-openapi3.yml`.
    const s = await scaffold({ name: 'petstore', def: '' })
    assert.ok(
      s.exists('.sdk/def/petstore-openapi3.yml'),
      'expected defaulted def filename in .sdk/def/')
  })


  test('sdk-jsonic-substitutes-name-and-def', async () => {
    const s = await scaffold({ name: 'petstore' })
    const sdk = s.read('.sdk/model/sdk.jsonic')

    // Fragment placeholders NAME/DEF are replaced with the real values.
    assert.match(sdk, /name:\s*'petstore'/)
    assert.match(sdk, /def:\s*'petstore\.yml'/)

    // No unreplaced placeholder tokens remain.
    assert.doesNotMatch(sdk, /'NAME'/)
    assert.doesNotMatch(sdk, /'DEF'/)
  })


  test('dryrun-writes-no-scaffold', async () => {
    const s = await scaffold({ dryrun: true })
    // The scaffold itself is not written on a dry run.
    assert.equal(s.exists('.sdk/model/sdk.jsonic'), false)
    assert.equal(s.exists('.sdk/package.json'), false)
    assert.equal(s.exists('.gitignore'), false)
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
        Fs.existsSync(Path.join(work, 'alpha-sdk', '.sdk', 'model', 'sdk.jsonic')),
        'alpha -> alpha-sdk')

      // Name already ending `-sdk` -> not doubled.
      await CreateSdkGen({ debug: 'warn' } as any).generate({
        root: 'CreateRoot', name: 'beta-sdk', def,
        project: 'standard', folder: '', install: false,
      } as any)
      assert.ok(
        Fs.existsSync(Path.join(work, 'beta-sdk', '.sdk', 'model', 'sdk.jsonic')),
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

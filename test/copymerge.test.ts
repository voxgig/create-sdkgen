/* Copyright (c) 2026 Richard Rodger, MIT License */

import { test, describe, after } from 'node:test'
import assert from 'node:assert'

import * as Fs from 'node:fs'
import * as Os from 'node:os'
import Path from 'node:path'

import { CreateSdkGen } from '../'

import { fingerprint, readScaffold } from '../dist/scaffold-record'


const TMP_ROOT = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'csdk-merge-'))

const DEF_CONTENT =
  'openapi: 3.0.0\ninfo:\n  title: Pet Store\n  version: 1.0.0\npaths: {}\n'

const ROOT_TS = '.sdk/src/Root.ts'


after(() => {
  Fs.rmSync(TMP_ROOT, { recursive: true, force: true })
})


async function project() {
  const work = Fs.mkdtempSync(Path.join(TMP_ROOT, 'p-'))
  const out = Path.join(work, 'out')
  const def = Path.join(work, 'petstore.yml')
  Fs.writeFileSync(def, DEF_CONTENT)

  const create = (over: any = {}) => CreateSdkGen({ debug: 'warn' } as any).generate({
    root: 'CreateRoot', name: 'petstore', def,
    project: 'standard', folder: out, install: false, ...over,
  } as any)

  await create()

  const path = (rel: string) => Path.join(out, ...rel.split('/'))
  const read = (rel: string) => Fs.readFileSync(path(rel), 'utf8')
  const write = (rel: string, text: string) => {
    Fs.mkdirSync(Path.dirname(path(rel)), { recursive: true })
    Fs.writeFileSync(path(rel), text)
  }

  // What an older scaffold wrote: the current file with another first line,
  // recorded and kept as its base.
  const age = (rel: string) => {
    const current = read(rel)
    const older = ['// an older first line', ...current.split('\n').slice(1)].join('\n')
    write('.sdk/log/scaffold-base/' + rel, older)
    Fs.appendFileSync(path('.sdk/log/scaffold.jsonl'),
      JSON.stringify({ op: 'scaffold', files: { [rel]: fingerprint(older) } }) + '\n')
    return { current, older }
  }

  return { out, create, path, read, write, age }
}


describe('re-scaffold merge', () => {

  test('a scaffold records what it wrote, and not the project overlay', async () => {
    const p = await project()
    const record = readScaffold(Fs, p.out)

    assert.equal(record[ROOT_TS], fingerprint(p.read(ROOT_TS)))
    assert.equal(record['.sdk/model/project.aontu'], undefined)
    assert.ok(!Object.keys(record).some((rel: string) => rel.startsWith('.sdk/def/')))
  })


  test('a local change to a scaffold file survives a re-scaffold', async () => {
    const p = await project()
    const edited = p.read(ROOT_TS) + '\n// a local change\n'
    p.write(ROOT_TS, edited)

    await p.create()

    assert.equal(p.read(ROOT_TS), edited)
  })


  test('a local change takes a newer scaffold in other lines', async () => {
    const p = await project()
    const { current, older } = p.age(ROOT_TS)
    p.write(ROOT_TS, older + '\n// a local change\n')

    await p.create()

    assert.equal(p.read(ROOT_TS), current + '\n// a local change\n')
    assert.equal(p.read('.sdk/log/scaffold-base/' + ROOT_TS), current)
  })


  test('a conflict changes nothing and leaves the incoming file to read', async () => {
    const p = await project()
    const { older } = p.age(ROOT_TS)
    const local = ['// a local first line', ...older.split('\n').slice(1)].join('\n')
    p.write(ROOT_TS, local)

    await assert.rejects(p.create(), /cannot take the incoming copy/)

    assert.equal(p.read(ROOT_TS), local)
    const preview = p.read('.sdk/log/scaffold-conflict/' + ROOT_TS)
    assert.match(preview, /^<<<<<<< LOCAL$/m)
    assert.match(preview, /^>>>>>>> INCOMING \(/m)

    await p.create({ keep: true })
    assert.equal(p.read(ROOT_TS), local)
  })


  test('overwrite mode, and --force, take the incoming scaffold', async () => {
    const p = await project()
    const original = p.read(ROOT_TS)

    p.write(ROOT_TS, original + '\n// a local change\n')
    await p.create({ force: true })
    assert.equal(p.read(ROOT_TS), original)

    p.write('.sdk/model/project.aontu',
      p.read('.sdk/model/project.aontu') + "\nmain: kit: copies: 'overwrite'\n")
    p.write(ROOT_TS, original + '\n// a local change\n')
    await p.create()
    assert.equal(p.read(ROOT_TS), original)
  })


  test('a file the build regenerates is overwritten, not merged', async () => {
    const p = await project()
    const seed = '.sdk/model/entity/entity-index.aontu'
    const original = p.read(seed)
    p.write(seed, original + '\n@"./pet.aontu"\n')

    await p.create()

    assert.equal(p.read(seed), original)
    assert.equal(readScaffold(Fs, p.out)[seed], undefined)
  })


  test('a project scaffolded before the record cannot be merged', async () => {
    const p = await project()
    Fs.rmSync(p.path('.sdk/log/scaffold.jsonl'))
    const original = p.read(ROOT_TS)
    p.write(ROOT_TS, original + '\n// a local change\n')

    await assert.rejects(p.create(), /no record of what the toolchain wrote here/)

    await p.create({ force: true })
    assert.equal(p.read(ROOT_TS), original)
    assert.equal(readScaffold(Fs, p.out)[ROOT_TS], fingerprint(original))
  })
})

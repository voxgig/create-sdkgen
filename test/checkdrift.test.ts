/* Copyright (c) 2026 Richard Rodger, MIT License */


import ChildProcess from 'node:child_process'
import Fs from 'node:fs'
import Os from 'node:os'
import Path from 'node:path'
import { after, describe, test } from 'node:test'
import { equal, match, ok } from 'node:assert'


const SCRIPT = Path.resolve(
  __dirname, '..', 'project', 'standard', '.sdk', 'admin', 'check-drift.sh')

const made: string[] = []
after(() => made.forEach((dir) => Fs.rmSync(dir, { recursive: true, force: true })))


// A project whose `npm run generate` writes `emit` and nothing else, committed
// with `tree` besides, so a file in `tree` but not in `emit` is stale output.
function project(target: any, tree: Record<string, string>,
  emit: Record<string, string>) {
  const dir = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'check-drift-'))
  made.push(dir)
  const write = (file: string, text: string) => {
    Fs.mkdirSync(Path.dirname(Path.join(dir, file)), { recursive: true })
    Fs.writeFileSync(Path.join(dir, file), text)
  }

  write('.sdk/admin/check-drift.sh', Fs.readFileSync(SCRIPT, 'utf8'))
  write('.sdk/model/sdk.json', JSON.stringify({ main: { kit: { target } } }))
  write('.sdk/emit.json', JSON.stringify(emit))
  write('.sdk/generate.js',
    'const Fs = require("node:fs"), Path = require("node:path")\n' +
    'for (const [f, t] of Object.entries(require("./emit.json"))) {\n' +
    '  Fs.mkdirSync(Path.dirname(Path.join("..", f)), { recursive: true })\n' +
    '  Fs.writeFileSync(Path.join("..", f), t)\n' +
    '}\n')
  write('.sdk/package.json', JSON.stringify({
    name: 'check-drift-fixture', private: true,
    scripts: { generate: 'node generate.js' },
  }))
  write('.gitignore', 'node_modules/\n')
  write('node_modules/dep/index.js', 'ignored, not output\n')
  for (const [file, text] of Object.entries(tree)) write(file, text)

  const git = (...args: string[]) => ChildProcess.execFileSync('git',
    ['-c', 'user.email=test@example.com', '-c', 'user.name=test', ...args],
    { cwd: dir, stdio: 'pipe' })
  git('init', '-q')
  git('add', '-A')
  git('commit', '-q', '-m', 'fixture')

  const run = ChildProcess.spawnSync('bash', [Path.join(dir, '.sdk/admin/check-drift.sh')],
    { cwd: dir, encoding: 'utf8' })

  return { dir, status: run.status, out: run.stdout + run.stderr }
}


describe('check-drift', {
  skip: 'win32' === process.platform && 'the admin scripts are bash',
}, () => {

  test('a stale file in a target folder is reported', () => {
    const p = project({ ts: { name: 'ts' } },
      { 'ts/a.ts': 'a\n', 'ts/stale.ts': 'old\n' },
      { 'ts/a.ts': 'a\n' })
    equal(p.status, 1, p.out)
    match(p.out, /D ts\/stale\.ts/)
  })


  test('a stale file of a target generated at the root is reported', () => {
    const tree = {
      '.gitignore': 'node_modules/\n', 'README.md': 'r\n',
      'src/a.ts': 'a\n', 'src/stale.ts': 'old\n',
    }
    const p = project({ p: { name: 'p', output: { root: true } } }, tree,
      { '.gitignore': 'node_modules/\n', 'README.md': 'r\n', 'src/a.ts': 'a\n' })
    equal(p.status, 1, p.out)
    match(p.out, /D src\/stale\.ts/)
    ok(!/\.sdk\//.test(p.out.split('DRIFT')[1] || ''), p.out)
    ok(Fs.existsSync(Path.join(p.dir, 'node_modules/dep/index.js')))
  })


  test('a target generated at the root, reproduced exactly, is clean', () => {
    const emit = { '.gitignore': 'node_modules/\n', 'README.md': 'r\n', 'src/a.ts': 'a\n' }
    const p = project({ p: { name: 'p', output: { root: true } } }, emit, emit)
    equal(p.status, 0, p.out)
    match(p.out, /check-drift: clean/)
  })

})

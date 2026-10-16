/* Copyright (c) 2026 Richard Rodger, MIT License */


import ChildProcess from 'node:child_process'
import Fs from 'node:fs'
import Os from 'node:os'
import Path from 'node:path'
import { after, describe, test } from 'node:test'
import { deepEqual, equal, match, ok } from 'node:assert'

import { TARGETS, forwardingError } from '../dist/create-sdkgen'


const BIN = Path.resolve(__dirname, '..', 'bin', 'create-sdkgen')

const made: string[] = []
after(() => made.forEach((dir) => Fs.rmSync(dir, { recursive: true, force: true })))


// The environment the CLI sees, less anything npm put there for this run.
function cleanEnv(over: Record<string, string> = {}) {
  const env: Record<string, string | undefined> = { ...process.env }
  for (const key of Object.keys(env).filter((key) => key.startsWith('npm_config_'))) {
    delete env[key]
  }
  return { ...env, ...over }
}


function runBin(args: string[], env: Record<string, string> = {}) {
  const cwd = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'csdk-args-'))
  made.push(cwd)
  const run = ChildProcess.spawnSync(process.execPath, [BIN, ...args],
    { cwd, env: cleanEnv(env), encoding: 'utf8' })
  return { cwd, status: run.status, out: run.stdout + run.stderr }
}


describe('npm-create-forwarding', () => {

  test('target names pass, alone or comma-joined', () => {
    equal(forwardingError('foo', ['ts', 'py,go', 'py-data'], {}), undefined)
    equal(forwardingError('foo', [], {}), undefined)
  })

  test('a value npm passed on without its flag is refused, with the -- form', () => {
    const msg = forwardingError('foo', ['./openapi.yaml', './out', 'ts'], {})
    ok(msg)
    match(msg, /Not a target: \.\/openapi\.yaml, \.\/out\./)
    match(msg, /npm create @voxgig\/sdkgen@latest foo -- -d \.\/openapi\.yaml -t ts/)
  })

  test('a flag npm kept for itself is refused, so a dry run cannot run for real', () => {
    match(forwardingError('foo', [], { npm_config_dryrun: 'true' }) || '',
      /npm kept --dryrun for itself/)
    match(forwardingError('foo', [], { npm_config_install: '' }) || '',
      /npm kept --no-install for itself/)
  })

  test('the target list names each language target once', () => {
    deepEqual([...new Set(TARGETS)].sort(), [...TARGETS].sort())
    for (const target of ['ts', 'py-data', 'go-mcp', 'lean']) {
      ok(TARGETS.includes(target), target)
    }
  })

  test('the CLI refuses a spec path where a target goes, and writes nothing', () => {
    const run = runBin(['petstore', './openapi.yaml', '--no-install', '--dryrun'])
    equal(run.status, 1, run.out)
    match(run.out, /Not a target: \.\/openapi\.yaml\./)
    match(run.out, / -- -d \.\/openapi\.yaml -t ts/)
    deepEqual(Fs.readdirSync(run.cwd), [])
  })

  test('the CLI refuses a run npm stripped --dryrun from', () => {
    const run = runBin(['petstore', '--no-install'], { npm_config_dryrun: 'true' })
    equal(run.status, 1, run.out)
    match(run.out, /npm kept --dryrun for itself/)
    deepEqual(Fs.readdirSync(run.cwd), [])
  })

  test('help names the -- separator', () => {
    const run = runBin(['--help'])
    equal(run.status, 0, run.out)
    match(run.out, /npm create @voxgig\/sdkgen@latest <name> -- <args>/)
  })
})

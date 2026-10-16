/* Copyright (c) 2026 Richard Rodger, MIT License */


import { describe, test } from 'node:test'
import { deepEqual, equal, throws } from 'node:assert'

import { npmEnv, npmLaunch } from '../dist/create-sdkgen'


const NODE_WIN = 'C:\\Program Files\\nodejs\\node.exe'
const BUNDLED = 'C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js'
const RUNNING = 'C:\\Users\\a\\AppData\\Roaming\\npm\\node_modules\\npm\\bin\\npm-cli.js'


function host(platform: string, env: Record<string, string>, present: string[] = []) {
  return {
    platform,
    env,
    execPath: 'win32' === platform ? NODE_WIN : '/usr/local/bin/node',
    exists: (path: string) => present.includes(path),
  }
}


describe('npm-launch', () => {

  test('elsewhere, npm is spawned by name', () => {
    deepEqual(npmLaunch(['install'], host('linux', {})), { command: 'npm', args: ['install'] })
    deepEqual(npmLaunch(['install'], host('darwin', { npm_execpath: '/x/npm-cli.js' }, ['/x/npm-cli.js'])),
      { command: 'npm', args: ['install'] })
  })

  test('on Windows, the npm that launched the run is run on this node', () => {
    deepEqual(
      npmLaunch(['run', 'add-target', 'ts,py'],
        host('win32', { npm_execpath: RUNNING }, [RUNNING, BUNDLED])),
      { command: NODE_WIN, args: [RUNNING, 'run', 'add-target', 'ts,py'] })
  })

  test('on Windows, with no npm_execpath, the npm shipped beside node runs', () => {
    deepEqual(npmLaunch(['install'], host('win32', {}, [BUNDLED])),
      { command: NODE_WIN, args: [BUNDLED, 'install'] })
  })

  test("on Windows, another package manager's entry script is not run as npm", () => {
    const pnpm = 'C:\\pnpm\\bin\\pnpm.cjs'
    deepEqual(npmLaunch(['install'], host('win32', { npm_execpath: pnpm }, [pnpm, BUNDLED])),
      { command: NODE_WIN, args: [BUNDLED, 'install'] })
  })

  test('on Windows, with no npm-cli.js at all, npm.cmd runs through the shell', () => {
    const launch = npmLaunch(['run', 'add-feature', 'test'], host('win32', {}))
    deepEqual(launch, { command: 'npm.cmd "run" "add-feature" "test"', args: [], shell: true })
    throws(() => npmLaunch(['run', 'add-target', '%PATH%'], host('win32', {})), /cmd\.exe/)
    throws(() => npmLaunch(['run', 'add-target', 'a"b'], host('win32', {})), /cmd\.exe/)
  })

  test('the child finds this node first, under the PATH key the platform uses', () => {
    deepEqual(npmEnv(host('win32', { Path: 'C:\\Windows' })),
      { Path: 'C:\\Program Files\\nodejs;C:\\Windows' })
    equal(npmEnv(host('linux', { PATH: '/usr/bin' })).PATH, '/usr/local/bin:/usr/bin')
    equal(npmEnv(host('linux', {})).PATH, '/usr/local/bin', 'no empty element, which is the cwd')
  })
})

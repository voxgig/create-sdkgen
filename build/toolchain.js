// Move the scaffold's Voxgig toolchain pins to the latest published patch
// line of each package, or with --check report the pins that lag it. Reads
// the npm registry; nothing here runs in the test suite.

'use strict'

const Fs = require('node:fs')
const Path = require('node:path')
const { execFileSync } = require('node:child_process')

const MANIFEST = Path.join(__dirname, '..', 'project', 'standard', '.sdk', 'package.json')

const TOOLCHAIN = ['@voxgig/apidef', '@voxgig/model', '@voxgig/sdkgen', '@voxgig/docgen']

// A registry lookup that has not answered by then is reported, so a stalled
// registry fails inside the status cadence rather than hanging in silence.
const LOOKUP_MS = 20_000

// npm is npm.cmd on Windows, which only a shell can launch.
const SHELL = 'win32' === process.platform

function latest(name) {
  try {
    return execFileSync('npm', ['view', name, 'version'], {
      encoding: 'utf8',
      shell: SHELL,
      timeout: LOOKUP_MS,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  }
  catch (err) {
    const why = null != err.signal
      ? 'no answer within ' + (LOOKUP_MS / 1000) + 's'
      : String(err.stderr || err.message).trim()
    throw new Error('npm view ' + name + ' version: ' + why)
  }
}

function pinLine(name) {
  return new RegExp('("' + name.replace(/[/@.]/g, '\\$&') + '":\\s*")([^"]*)(")')
}

function main(args) {
  const check = args.includes('--check')
  let text = Fs.readFileSync(MANIFEST, 'utf8')
  const lagging = []

  TOOLCHAIN.forEach((name, i) => {
    const match = text.match(pinLine(name))
    if (null == match) {
      throw new Error(name + ' is not in ' + MANIFEST)
    }
    console.log('toolchain: ' + (i + 1) + '/' + TOOLCHAIN.length +
      ' (' + Math.round(100 * i / TOOLCHAIN.length) + '%) looking up ' + name)
    const current = match[2]
    const want = '~' + latest(name)
    if (current === want) {
      console.log(name + ' ' + current)
      return
    }
    lagging.push(name)
    console.log(name + ' ' + current + ' -> ' + want)
    text = text.replace(pinLine(name), '$1' + want + '$3')
  })

  if (0 === lagging.length) {
    console.log('toolchain: every pin names the latest patch line')
    return 0
  }

  if (check) {
    console.log('toolchain: ' + lagging.join(', ') + ' lag the registry; `npm run toolchain` moves them')
    return 1
  }

  Fs.writeFileSync(MANIFEST, text)
  console.log('toolchain: moved ' + lagging.join(', ') + '; scaffold a project against the result before releasing')
  return 0
}

try {
  process.exit(main(process.argv.slice(2)))
}
catch (err) {
  console.error('toolchain: ' + err.message)
  process.exit(2)
}

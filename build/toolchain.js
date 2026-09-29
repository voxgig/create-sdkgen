// Move the scaffold's Voxgig toolchain pins to the latest published patch
// line of each package, or with --check report the pins that lag it. Reads
// the npm registry; nothing here runs in the test suite.

'use strict'

const Fs = require('node:fs')
const Path = require('node:path')
const { execFileSync } = require('node:child_process')

const MANIFEST = Path.join(__dirname, '..', 'project', 'standard', '.sdk', 'package.json')

const TOOLCHAIN = ['@voxgig/apidef', '@voxgig/model', '@voxgig/sdkgen', '@voxgig/docgen']

function latest(name) {
  return execFileSync('npm', ['view', name, 'version'], { encoding: 'utf8' }).trim()
}

function pinLine(name) {
  return new RegExp('("' + name.replace(/[/@.]/g, '\\$&') + '":\\s*")([^"]*)(")')
}

function main(args) {
  const check = args.includes('--check')
  let text = Fs.readFileSync(MANIFEST, 'utf8')
  const lagging = []

  for (const name of TOOLCHAIN) {
    const match = text.match(pinLine(name))
    if (null == match) {
      console.error('toolchain: ' + name + ' is not in ' + MANIFEST)
      return 2
    }
    const current = match[2]
    const want = '~' + latest(name)
    if (current === want) {
      console.log(name + ' ' + current)
      continue
    }
    lagging.push(name)
    console.log(name + ' ' + current + ' -> ' + want)
    text = text.replace(pinLine(name), '$1' + want + '$3')
  }

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

process.exit(main(process.argv.slice(2)))

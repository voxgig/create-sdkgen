// A test run that executes ZERO tests must not report success.
//
// `npm test` globs `dist-test/**/*.test.js`. When the TypeScript build fails,
// `noEmitOnError` leaves dist-test/ with nothing in it, the glob matches
// nothing, and `node --test` exits 0 having run nothing at all:
//
//   ℹ tests 0
//   ℹ pass 0
//   ℹ fail 0
//
// That is indistinguishable from a green suite. It is reachable through this
// repo's own scripts - `npm run clean` removes dist-test/ (which IS committed),
// so `reset` and `repo-publish` both pass through the window where a broken
// build yields a passing test run.
//
// CI is protected only because `npm run build` is a separate step that fails
// first. Anyone running `npm test` by hand after a failed build is not.
//
// This runs as `pretest` AND `pretest-some`. npm only associates a `pre`
// hook with the script of that exact name, so one hook guards one entry
// point - `test-some` bypassed a `pretest`-only guard entirely and still
// reported `tests 0` with exit 0. Every script that reaches the runner
// needs its own hook.

const Fs = require('node:fs')
const Path = require('node:path')

const DIST_TEST = Path.join(__dirname, '..', 'dist-test')

function compiledTests(dir) {
  if (!Fs.existsSync(dir)) return []
  return Fs.readdirSync(dir, { recursive: true })
    .filter((f) => 'string' === typeof f && f.endsWith('.test.js'))
}

const found = compiledTests(DIST_TEST)

if (0 === found.length) {
  console.error(
    'no compiled tests in dist-test/ — nothing would run, and `node --test` ' +
    'reports that as a PASS.\n' +
    'Run `npm run build` first; if it fails, that failure is the real problem ' +
    '(noEmitOnError leaves dist-test/ empty).')
  process.exit(1)
}

console.log(found.length + ' compiled test file(s) in dist-test/')

import Path from 'node:path'


const TREES = ['model', 'test']

const LEGACY = '.aon'
const CURRENT = '.aontu'

const TOOLCHAIN_RE = /^@voxgig\//
const APIDEF_WRITES_RE = /^model\/guide\/[^/]*base-guide\.aontu$/

// Comments and strings are matched whole, so an include is only ever an `@`
// outside both: a `.aon` named in a comment or held as data is not rewritten.
const TOKEN_RE =
  /#[^\n]*|@([ \t]*)(["'`])([^"'`\n]*)\2|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/g


type Warn = (file: string, note: string) => void

type Scaffold = {
  kept: Set<string>
  replaced: Set<string>
}


// A BARE FILENAME ALSO NEEDS `./`. aontu has required the prefix for a local
// file since 0.65, so rewriting only the extension left an include still
// refused, with "local files need a ./ prefix". An include already carrying a
// directory segment is unambiguous and is left alone.
function localPrefix(path: string): string {
  return path.includes('/') || path.startsWith('./') ? path : './' + path
}


function rewriteIncludes(src: string, rename: (path: string) => boolean): string {
  return src.replace(TOKEN_RE, (token: string, space: string, quote: string, path: string) =>
    null != quote && path.endsWith(LEGACY) && rename(path) ?
      '@' + space + quote + localPrefix(path.slice(0, -LEGACY.length) + CURRENT) + quote : token)
}


function legacyIncludes(src: string): string[] {
  return [...src.matchAll(TOKEN_RE)]
    .filter((m) => null != m[2] && m[3].endsWith(LEGACY))
    .map((m) => m[3])
}


function modelFiles(fs: any, sdk: string, ext: string): string[] {
  const found: string[] = []
  const walk = (rel: string) => {
    let entries: any[]
    try {
      entries = fs.readdirSync(Path.join(sdk, rel), { withFileTypes: true })
    }
    catch (_err: any) {
      return
    }
    for (const entry of entries) {
      const child = rel + '/' + entry.name
      if (entry.isDirectory()) {
        walk(child)
      }
      else if (entry.isFile() && entry.name.endsWith(ext)) {
        found.push(child)
      }
    }
  }
  TREES.forEach(walk)
  return found.sort()
}


function scaffoldFiles(fs: any, templateSdk: string, kept: string[]): Scaffold {
  const keep = new Set(kept)
  const written = modelFiles(fs, templateSdk, CURRENT)
    .map((rel: string) => rel.replace('.fragment.', '.'))
  return { kept: keep, replaced: new Set(written.filter((rel) => !keep.has(rel))) }
}


// A failed step must not fail the scaffold: the file keeps the name it had.
function attempt(step: () => void): void {
  try {
    step()
  }
  catch (_err: any) {
  }
}


// Written beside the target and renamed over it, so a write that fails part
// way leaves the file it would have replaced whole.
function writeWhole(fs: any, path: string, data: any): void {
  const tmp = path + '.migrating'
  try {
    fs.writeFileSync(tmp, data)
    fs.renameSync(tmp, path)
  }
  catch (err: any) {
    attempt(() => fs.unlinkSync(tmp))
    throw err
  }
}


function migrateFile(fs: any, prev: string, next: string): void {
  if (fs.existsSync(next) || !fs.existsSync(prev)) {
    return
  }
  attempt(() => {
    writeWhole(fs, next, fs.readFileSync(prev))
    fs.unlinkSync(prev)
  })
}


function includeRenamer(fs: any, sdk: string, scaffold: Scaffold, from: string) {
  const dir = Path.dirname(Path.join(sdk, from))
  return (path: string): boolean => {
    if (TOOLCHAIN_RE.test(path)) {
      return true
    }
    if (path.startsWith('@')) {
      return false
    }
    const twin = Path.resolve(dir, path.slice(0, -LEGACY.length) + CURRENT)
    const rel = Path.relative(sdk, twin).split(Path.sep).join('/')
    return fs.existsSync(twin) || scaffold.kept.has(rel) || scaffold.replaced.has(rel) ||
      APIDEF_WRITES_RE.test(rel)
  }
}


// Renames first and rewrites after, so an include changes only once the file
// it names is on disk as .aontu.
function migrateToAontu(fs: any, sdk: string, scaffold: Scaffold, warn: Warn): void {
  const legacy = modelFiles(fs, sdk, LEGACY)
  const twin = (rel: string) => rel.slice(0, -LEGACY.length) + CURRENT
  const abs = (rel: string) => Path.join(sdk, rel)

  for (const rel of legacy.filter((rel) => !scaffold.replaced.has(twin(rel)))) {
    migrateFile(fs, abs(rel), abs(twin(rel)))
  }

  const sources = modelFiles(fs, sdk, CURRENT).filter((rel) => !scaffold.replaced.has(rel))
  for (const rel of sources) {
    attempt(() => {
      const src = String(fs.readFileSync(abs(rel)))
      const out = rewriteIncludes(src, includeRenamer(fs, sdk, scaffold, rel))
      if (out !== src) {
        writeWhole(fs, abs(rel), out)
      }
    })
  }

  for (const rel of legacy.filter((rel) => scaffold.replaced.has(twin(rel)))) {
    attempt(() => fs.unlinkSync(abs(rel)))
  }

  for (const rel of modelFiles(fs, sdk, LEGACY)) {
    warn(rel, fs.existsSync(abs(twin(rel))) ?
      'left in place: ' + twin(rel) + ' exists, and is the file aontu reads' :
      'could not be migrated to ' + twin(rel))
  }
  for (const rel of sources) {
    attempt(() => {
      for (const path of legacyIncludes(String(fs.readFileSync(abs(rel))))) {
        warn(rel, 'includes ' + path + ', which aontu refuses: rename that file ' +
          'to .aontu and update the include')
      }
    })
  }
}


export {
  migrateToAontu,
  rewriteIncludes,
  scaffoldFiles,
}

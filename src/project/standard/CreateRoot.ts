

import Path from 'node:path'

import {
  names,
  cmp,

  Project,
  Folder,
  Copy,
  File,
  Content,

} from 'jostraca'


import { ModelSdk } from './ModelSdk'
import { migrateToAontu, scaffoldFiles } from './migrate'


const GITIGNORE_TOP = `# Local config / secrets
*.local.*
*.local

# Dependencies (no trailing slash: also ignores node_modules SYMLINKS, e.g.
# ts/node_modules -> shared tree, which a dir-only rule leaves tracked)
node_modules

# Logs
*.log
logs/

# OS
.DS_Store

# Editor
*~
*.swp
`


const GITIGNORE_SDK = `# Local config / secrets
*.local.*
*.local

# Dependencies (no trailing slash: also ignores node_modules SYMLINKS, e.g.
# .sdk/node_modules -> shared tree, which a dir-only rule leaves tracked)
node_modules

# Build output
dist/
dist-test/
*.tsbuildinfo

# Generated logs
log/
*.log

# OS
.DS_Store
`


const PROJECT_FILE = 'project.aontu'
const PROJECT_STUB = `# Project overlay — YOURS. The scaffold creates this file once and never
# overwrites it, unlike every other file it writes.
#
# Everything else under model/ is toolchain-derived and is deliberately
# regenerated so that toolchain fixes propagate. Put anything here that is a
# decision about THIS project rather than a fact about the API.
#
# Included LAST by sdk.aontu, after target/target-index.aontu, because a key
# under main.kit.target.<t> can only refine a target that has already been
# defined. Declared earlier, the model build fails with "Cannot unify value:
# nil with value: string / key ext value was: nil", which names nothing that
# would lead you here.
#
# The release version each generated manifest declares (package.json,
# pyproject.toml, the gemspec, the rockspec) and that the port Makefiles tag:
#
#   main: kit: target: ts: publish: version: '1.2.3'
#
# Per target, because ports publish to different registries on different
# clocks. Set every target to the same value for a lockstep repo.
#
# A published package name that does not follow the derivation:
#
#   main: kit: target: ts: publish: registry: package: '@scope/name'
`


const GUIDE_FILE = 'guide.aontu'
const GUIDE_REL = ['model', 'guide', GUIDE_FILE]

const INDEX_KINDS = ['target', 'feature', 'edition']
const indexFile = (kind: string) => kind + '-index.aontu'

// Written back from the project rather than from the template.
const KEPT = [
  ['model', PROJECT_FILE],
  GUIDE_REL,
  ...INDEX_KINDS.map((kind: string) => ['model', kind, indexFile(kind)]),
].map((rel: string[]) => rel.join('/'))


function mergeGuide(existing: string | null, template: string): string {
  if (null == existing) {
    return template
  }

  const isInclude = (line: string) => line.trim().startsWith('@')

  const key = (line: string) => line.trim().replace(/^@"\.\//, '@"')

  const have = new Set(existing.split('\n').map(key))
  const missing = template.split('\n')
    .filter(isInclude)
    .map((line: string) => line.trim())
    .filter((line: string) => !have.has(key(line)))

  if (0 === missing.length) {
    return existing
  }

  return missing.join('\n') + '\n\n' + existing
}


function sanitizeDefName(filename: string): string {
  const clean = filename
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    // yu-gi-oh!_0.1.0.json would otherwise keep the '!' as a dangling '-'
    // before the version separator: yu-gi-oh-_0.1.0.json.
    .replace(/-+([._])/g, '$1')
    .replace(/([._])-+/g, '$1')
    .replace(/^-|-$/g, '')
  return '' === clean ? 'openapi.yml' : clean
}


const CreateRoot = cmp(function CreateRoot(props: any) {
  const { ctx$, ctx$: { folder }, spec, model } = props
  const fs = ctx$.fs()

  model.const = { name: model.name }
  names(model.const, model.name)
  model.const.year = new Date().getFullYear()
  model.const.License = 'MIT'

  ctx$.model = model

  Project({ folder }, () => {
    const from =
      Path.resolve(Path.join(__dirname, '..', '..', '..', 'project', 'standard'))


    const guideExclude = [spec.sdk_folder, ...GUIDE_REL].join('/')
    const indexExclude = INDEX_KINDS.map((kind: string) =>
      [spec.sdk_folder, 'model', kind, indexFile(kind)].join('/'))

    Copy({
      from,
      exclude: [/\.fragment\./, guideExclude, ...indexExclude, /^\.sdk\/admin\/.*\.sh$/]
    })

    File({ name: '.gitignore' }, () => {
      Content(GITIGNORE_TOP)
    })

    const origdef = spec.def
    const projdef = sanitizeDefName(Path.basename(origdef))
    spec.def = projdef

    Folder({ name: spec.sdk_folder }, () => {
      // Before anything reads the project's own files, so a project from the
      // .aon era is read under the names it now has.
      if (!spec.dryrun) {
        const sdk = Path.join(folder, spec.sdk_folder)
        migrateToAontu(fs, sdk, scaffoldFiles(fs, Path.join(from, spec.sdk_folder), KEPT),
          (file: string, note: string) => ctx$.log.warn({
            point: 'migrate-aontu', file: Path.join(sdk, file), note: file + ': ' + note,
          }))
      }

      Folder({ name: 'admin' }, () => {
        const admin = Path.join(from, spec.sdk_folder, 'admin')
        for (const name of fs.readdirSync(admin).filter((name: string) => name.endsWith('.sh')).sort()) {
          File({ name, mode: 0o755 }, () => Content(fs.readFileSync(Path.join(admin, name), 'utf8')))
        }
      })

      File({ name: '.gitignore' }, () => {
        Content(GITIGNORE_SDK)
      })

      Folder({ name: 'def' }, () => {
        if (fs.existsSync(origdef)) {
          Copy({ from: origdef, to: projdef })
        }
        else {
          File({ name: projdef }, () => {
            Content('# OpenAPI Definition')
          })
        }
      })

      Folder({ name: 'model' }, () => {
        ModelSdk({ spec })

        // The project overlay, created once. An existing one is re-emitted
        // unchanged rather than skipped, so the write is a no-op instead of a
        // special case in the component tree.
        const projectPath =
          Path.join(folder, spec.sdk_folder, 'model', PROJECT_FILE)

        const existingProject =
          fs.existsSync(projectPath) ? fs.readFileSync(projectPath, 'utf8') : null

        File({ name: PROJECT_FILE }, () => {
          Content(null == existingProject ? PROJECT_STUB : existingProject)
        })

        // `target add`, `feature add` and docgen register their items here, and
        // docgen bootstraps only once, so a reset index would lose them for good.
        for (const kind of INDEX_KINDS) {
          Folder({ name: kind }, () => {
            const name = indexFile(kind)
            const indexPath = Path.join(folder, spec.sdk_folder, 'model', kind, name)
            File({ name }, () => {
              Content(fs.existsSync(indexPath) ?
                fs.readFileSync(indexPath, 'utf8') :
                fs.readFileSync(Path.join(from, spec.sdk_folder, 'model', kind, name), 'utf8'))
            })
          })
        }

        // Re-emit the guide the Copy skipped, merged over whatever is already
        // there. On a fresh scaffold there is no existing file and this writes
        // the template unchanged; on a re-scaffold the user's overlay survives.
        Folder({ name: 'guide' }, () => {
          const guideTemplate =
            fs.readFileSync(Path.join(from, spec.sdk_folder, ...GUIDE_REL), 'utf8')
          const guidePath = Path.join(folder, spec.sdk_folder, ...GUIDE_REL)
          const existingGuide =
            fs.existsSync(guidePath) ? fs.readFileSync(guidePath, 'utf8') : null

          File({ name: GUIDE_FILE }, () => {
            Content(mergeGuide(existingGuide, guideTemplate))
          })
        })
      })
    })

  })
})


export {
  CreateRoot,
  sanitizeDefName,
}

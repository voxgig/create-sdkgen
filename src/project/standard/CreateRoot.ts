

import Path from 'node:path'
// import * as Fs from 'node:fs'

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


// The guide overlay is the ONE model file the user owns.
//
// Everything else the scaffold writes is toolchain-derived and is deliberately
// OVERWRITTEN (see the `existing.txt.write` rationale in create-sdkgen.ts) so a
// toolchain fix propagates. `model/guide/guide.aontu` is the exception: apidef
// unifies it OVER the heuristic classification, and it is where every
// documented customization lives — entity rename, hide, move, activate,
// per-path deactivation, method override, param rename, response transform.
// Copying the stub over it destroyed that work on every re-scaffold, and
// cedar-regen.sh re-scaffolds on every regen, so the loss was silent and
// repeated.
//
// It is excluded from the bulk Copy and merged instead (see mergeGuide).
const GUIDE_FILE = 'guide.aontu'
const GUIDE_REL = ['model', 'guide', GUIDE_FILE]


// Merge the guide template into an existing guide overlay.
//
// A guide is the template's `@`-includes plus whatever the user added. The
// includes are the only part the template OWNS, so the merge is: keep the
// user's file verbatim, and restore any include it is missing. When nothing
// is missing — the normal case — the file is returned byte-identical, so a
// re-scaffold is a no-op on it.
//
// Missing includes are restored at the TOP, not appended: `base-guide.aontu`
// carries the heuristic classification that the user's overrides unify over,
// and the overlay reads correctly only when the includes precede it.
function mergeGuide(existing: string | null, template: string): string {
  if (null == existing) {
    return template
  }

  const isInclude = (line: string) => line.trim().startsWith('@')

  const have = new Set(existing.split('\n').map((line: string) => line.trim()))
  const missing = template.split('\n')
    .filter(isInclude)
    .map((line: string) => line.trim())
    .filter((line: string) => !have.has(line))

  if (0 === missing.length) {
    return existing
  }

  return missing.join('\n') + '\n\n' + existing
}


// TODO: rename to RootSdk
const CreateRoot = cmp(function CreateRoot(props: any) {
  const { ctx$, ctx$: { folder }, spec, model } = props
  const fs = ctx$.fs()

  // TODO: move to @voxgig/util as duplicated
  model.const = { name: model.name }
  names(model.const, model.name)
  model.const.year = new Date().getFullYear()
  // Scaffold is MIT-licensed (matches the emitted LICENSE and tm/LICENSE);
  // set directly rather than via names() so the value stays 'MIT', not 'Mit'.
  model.const.License = 'MIT'

  ctx$.model = model

  Project({ folder }, () => {
    const from =
      Path.resolve(Path.join(__dirname, '..', '..', '..', 'project', 'standard'))

    // console.log('FROM', from)

    // Copy `exclude` matches the SOURCE-RELATIVE path exactly, so this names
    // the one guide under the scaffold and nothing else. It is re-emitted,
    // merged, in the model folder below.
    const guideExclude = [spec.sdk_folder, ...GUIDE_REL].join('/')

    Copy({
      from,
      exclude: [/\.fragment\./, guideExclude]
    })

    File({ name: '.gitignore' }, () => {
      Content(GITIGNORE_TOP)
    })

    const origdef = spec.def
    const projdef = Path.basename(origdef)
    spec.def = projdef

    Folder({ name: spec.sdk_folder }, () => {
      File({ name: '.gitignore' }, () => {
        Content(GITIGNORE_SDK)
      })

      Folder({ name: 'def' }, () => {
        // TODO: file existence check should be jostraca util
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
  CreateRoot
}

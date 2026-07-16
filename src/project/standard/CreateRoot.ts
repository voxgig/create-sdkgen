

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

    Copy({
      from,
      exclude: [/\.fragment\./]
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
      })
    })

  })
})


export {
  CreateRoot
}

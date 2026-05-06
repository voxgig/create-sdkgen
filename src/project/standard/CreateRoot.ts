

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

# Dependencies
node_modules/

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

# Dependencies
node_modules/

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

  ctx$.model = model

  Project({ folder }, () => {
    const from =
      Path.resolve(Path.join(__dirname + '..', '..', '..', '..', 'project', 'standard'))

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
          console.log('DEF NOT FOUND: ', origdef)

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

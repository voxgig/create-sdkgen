

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

    const origdef = spec.def
    const projdef = Path.basename(origdef)
    spec.def = projdef

    Folder({ name: spec.sdk_folder }, () => {
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

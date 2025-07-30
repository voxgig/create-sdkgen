

import Path from 'node:path'
import * as Fs from 'node:fs'

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
const Root = cmp(function Root(props: any) {
  const { ctx$, ctx$: { folder }, spec, model } = props

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
      from
    })

    const origdef = spec.def
    const projdef = Path.basename(origdef)
    spec.def = projdef

    Folder({ name: '.sdk' }, () => {
      Folder({ name: 'def' }, () => {
        if (Fs.existsSync(origdef)) {
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
  Root
}

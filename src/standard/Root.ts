

import Path from 'node:path'
import * as Fs from 'node:fs'

import {
  names,
  cmp,
  each,

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

  ctx$.model = model

  Project({ folder }, () => {
    Copy({
      from: __dirname + '/../../tm/standard',
      exclude: ['generate/.env.local']
    })

    const origdef = spec.def
    const projdef = Path.basename(origdef)
    spec.def = projdef

    Folder({ name: 'generate' }, () => {
      Folder({ name: 'def' }, () => {
        if (Fs.existsSync(origdef)) {
          Copy({ from: origdef, to: projdef })
        }
        else {
          File({ name: projdef }, () => {
            Content('# Insert OpenAPI Definition here')
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

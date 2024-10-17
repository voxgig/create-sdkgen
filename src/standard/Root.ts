

import Path from 'node:path'


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
  const { model, ctx$ } = props

  const { folder, meta } = ctx$
  const { spec } = meta

  // names(model, model.name)

  ctx$.model = model

  Project({ folder }, () => {

    // console.log('FOLDER', folder)
    Copy({
      from: __dirname + '/../../tm/standard',
      exclude: ['.env.local']
    })

    const def = model.def.filepath
    if (null != def && '' !== def) {
      Folder({ name: 'def' }, () => {
        Copy({ from: def, name: Path.basename(def) })
      })
    }

    Folder({ name: 'model' }, () => {
      ModelSdk({})
    })

    Folder({ name: 'feature' }, () => {
      each(model.feature).map((feature: any) => {
        Folder({ name: feature.name }, () => {
          Copy({ from: __dirname + '/../../feature/standard/' + feature.name })
        })
      })
    })

  })

})


export {
  Root
}

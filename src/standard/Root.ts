

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


const Root = cmp(function Root(props: any) {
  const { model, ctx$ } = props

  const { folder, meta } = ctx$
  const { spec } = meta

  names(model, model.name)

  ctx$.model = model

  Project({ folder }, () => {

    // TODO: perhaps remove the need for this, create top level folder in Project
    // would keep paths indo of project folder name
    // Folder({ name: Path.basename(folder) }, () => {

    // File({ name: 'foo.txt' }, () => {
    //   Content('FOO')
    // })

    // console.log('FOLDER', folder)
    Copy({ from: __dirname + '/../../tm/standard' })

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
      Copy({ from: __dirname + '/../../feature/standard' })
    })

  })

})


export {
  Root
}

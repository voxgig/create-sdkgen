

import Path from 'node:path'


import {
  names,
  cmp,
  each,

  Project,
  Folder,
  Copy,

} from 'jostraca'



const Root = cmp(function Root(props: any) {
  const { model, ctx$ } = props

  const { folder, meta } = ctx$
  const { spec } = meta

  console.log('SPEC', spec)

  names(model, model.name)

  console.log('MODEL')
  console.dir(model, { depth: null })

  ctx$.model = model


  Project({ folder }, () => {

    Folder({ name: Path.basename(folder) }, () => {

      // console.log('FOLDER', folder)
      Copy({ from: __dirname + '/../../tm/standard', name: folder })

      const def = model.def.filepath
      if (null != def && '' !== def) {
        Folder({ name: 'def' }, () => {
          Copy({ from: def, name: Path.basename(def) })
        })
      }
    })
  })
})


export {
  Root
}

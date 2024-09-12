

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

  const folder = ctx$.folder

  names(model, model.name)

  console.log('MODEL')
  console.dir(model, { depth: null })

  ctx$.model = model


  Project({}, () => {

    Folder({ name: folder }, () => {

      console.log('FOLDER', folder)

      Copy({ from: __dirname + '/../../tm/standard', name: folder })
    })
  })
})


export {
  Root
}

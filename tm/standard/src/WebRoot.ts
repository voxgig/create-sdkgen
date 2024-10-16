
import {
  names,
  cmp,
  each,

  Project,
  Folder,

  Index,
} from '@voxgig/docgen'


const Root = cmp(function Root(props: any) {
  const { model, ctx$ } = props

  names(model, model.name)

  ctx$.model = model

  Project({}, () => {

    Index({})

  })
})


export {
  Root
}


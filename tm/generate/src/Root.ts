
import {
  names,
  cmp,
  each,

  Project,
  Folder,

  Main,
  Entity,
  Feature,
  Readme,

} from '@voxgig/sdkgen'


const Root = cmp(function Root(props: any) {
  const { model, ctx$ } = props

  // TODO: move to @voxgig/util as duplicated
  model.const = { name: model.name }
  names(model.const, model.name)
  model.const.year = new Date().getFullYear()

  ctx$.model = model

  const target = model.main.sdk.target
  const entity = model.main.sdk.entity
  const feature = model.main.sdk.feature

  Project({}, () => {

    each(target, (target: any) => {
      names(target, target.name)
      // console.log('TARGET', target.name)

      Folder({ name: target.name }, () => {

        each(entity, (entity: any) => {
          names(entity, entity.name)

          Entity({ target, entity })
        })

        each(feature).filter((feature: any) => feature.active).map((feature: any) => {
          names(feature, feature.name)

          Feature({ target, feature })
        })


        Main({ target })

        Readme({ target })
      })
    })
  })
})


export {
  Root
}



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

  names(model, model.name)

  ctx$.model = model

  const build = model.main.sdk.build
  const entity = model.main.sdk.entity
  const feature = model.main.sdk.feature

  Project({}, () => {

    each(build, (build: any) => {
      names(build, build.name)
      // console.log('BUILD', build.name)

      Folder({ name: build.name }, () => {

        each(entity, (entity: any) => {
          names(entity, entity.name)

          Entity({ build, entity })
        })

        each(feature).filter((feature: any) => feature.active).map((feature: any) => {
          names(feature, feature.name)

          Feature({ build, feature })
        })


        Main({ build })

        Readme({ build })
      })
    })
  })
})


export {
  Root
}


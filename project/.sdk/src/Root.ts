
import {
  requirePath,

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
  const feature = model.main.sdk.feature

  const entity = model.main.api.entity

  ctx$.log.debug({
    point: 'cmp-root', target, entity, feature, note: [
      '\ntarget: \n' + Object.keys(target).map(s => '  ' + s).join('\n'),
      '\nentity:\n' + Object.keys(entity).map(s => '  ' + s).join('\n'),
      '\nfeature:\n' + Object.keys(feature).map(s => '  ' + s).join('\n'),
    ].join('\n')
  })


  Project({}, () => {

    each(target, (target: any) => {
      names(target, target.name)

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


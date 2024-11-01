
import { cmp, Content, names, getx } from '@voxgig/sdkgen'


const ReadmeQuick = cmp(function ReadmeQuick(props: any) {
  const { build, ctx$: { model, meta: { spec } } } = props

  let ent = getx(spec.config.guideModel, 'guide entity *')
  .find((ent: any) => ent.test.quick.active)

  ent = ent || {}
  names(ent, ent.key$ || 'name')

  Content('```ruby')
  Content(`
require('${build.module.name}')

client = ${model.Name}SDK.new(
    {
      endpoint: ENV['${model.NAME}_ENDPOINT'],
      apikey: ENV['${model.NAME}_APIKEY'],
    }
  )

  # Loading ${ent.name}
  ${ent.name} = client.${ent.Name}.load(${JSON.stringify(ent.test?.quick.load)})
  puts "${ent.Name} loaded: #{${ent.Name}.data}"
`)
  Content('```')

})


export {
  ReadmeQuick
}

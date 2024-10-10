
import { cmp, each, File, Content, names, getx } from '@voxgig/sdkgen'


import { TestAcceptEntity } from "./TestAcceptEntity_rb"


const TestAccept = cmp(function TestAccept(props: any) {
  const { build } = props
  const { model, meta: { spec } } = props.ctx$

  let ent = getx(spec.config.guideModel, 'guide entity *')
  .find((ent: any) => ent.test.quick.active)

  ent = ent || {}
  names(ent, ent.key$ || 'name')


  File({ name: model.name + '_sdk_spec.rb' }, () => {

    Content(`
      RSpec.describe '${model.Name}SDK Acceptance Tests' do 
        before(:each) do
          @client = ${model.Name}SDK.new(
            apikey: ENV['${model.NAME}_APIKEY'],
            endpoint: ENV['${model.NAME}_ENDPOINT'],
            debug: true,
            page: {
              debug: true
            }
          )
        end

        it 'happy' do
          out = @client.${ent.Name}.load(${JSON.stringify(ent.test?.accept.load.data)})
          expect(out.data).to eq(${JSON.stringify(ent.test?.accept.load.expect.data)})
        end
    `)

    each(model.main.sdk.entity, (entity: any) => {
      TestAcceptEntity({ model, build, entity })
    })

    Content(`end`)


  })
})


export {
  TestAccept
}


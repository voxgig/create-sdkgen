
import { cmp, each, File, Content } from '@voxgig/sdkgen'


import { TestAcceptEntity } from "./TestAcceptEntity_rb"


const TestAccept = cmp(function TestAccept(props: any) {
  const { build } = props
  const { model } = props.ctx$


  File({ name: model.name + '_sdk_spec.rb' }, () => {

    Content(`
      RSpec.describe '${model.Name}SDK Acceptance Tests' do 
        before(:each) do
          @client = ${model.Name}SDK.new(
            apikey: ENV['${model.NAME}_APIKEY'],
            endpoint: ENV['${model.NAME}_ENDPOINT']
          )
        end

        it 'happy' do
          out = @client.Geofence.load(id: 'gf01')
          # puts 'Geofence-load', out.data()
          expect(out.data[:id]).to eq('gf01')
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


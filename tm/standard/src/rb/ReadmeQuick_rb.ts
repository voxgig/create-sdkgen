
import { cmp, Content } from '@voxgig/sdkgen'


const ReadmeQuick = cmp(function ReadmeQuick(props: any) {
  const { build, ctx$: { model } } = props

  Content('```ruby')
  Content(`
require('${build.module.name}')

client = ${model.Name}SDK::Client.new(
    {
      endpoint: ENV['${model.NAME}_ENDPOINT'],
      apikey: ENV['${model.NAME}_APIKEY'],
    }
  )

  # List all buildings
  buildings = client.Building.list()
  puts "Buildings: #{buildings.inspect}"
`)
  Content('```')

})


export {
  ReadmeQuick
}

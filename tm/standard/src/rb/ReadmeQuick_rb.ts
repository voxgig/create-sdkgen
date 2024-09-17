
import { cmp, Content } from '@voxgig/sdkgen'


const ReadmeQuick = cmp(function ReadmeQuick(props: any) {
  const { build, ctx$: { model } } = props

  Content('```ruby')
  Content(`
require('${build.module.name}')

client = PlantquestSDK::Client.new(
    {
      endpoint: ENV['PLANTQUEST_ENDPOINT'],
      apikey: ENV['PLANTQUEST_APIKEY'],
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

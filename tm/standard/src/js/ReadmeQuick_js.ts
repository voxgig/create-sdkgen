
import { cmp, Content } from '@voxgig/sdkgen'


const ReadmeQuick = cmp(function ReadmeQuick(props: any) {
  const { build, ctx$: { model } } = props

  Content('```js')
  Content(`
const { ${model.Name}SDK } = require('${build.module.name}')

const client = ${model.Name}SDK.make({
  endpoint: process.env.${model.NAME}_ENDPOINT,
  apikey: process.env.${model.NAME}_APIKEY,
})

let buildings = await client.Building().list()
console.log('Buildings', buildings) 
`)
  Content('```')

})


export {
  ReadmeQuick
}

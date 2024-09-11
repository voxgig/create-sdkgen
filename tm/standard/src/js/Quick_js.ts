
import { cmp, File, Code } from '@voxgig/sdkgen'


const Quick = cmp(function Quick_js(props: any) {
  const { build } = props
  const { model } = props.ctx$

  File({ name: 'quick.' + build.name }, () => {

    Code(`
require('dotenv').config({ path: ['../../.env.local']})

const { ${model.Name}SDK } = require('../')

run()

async function run() {
   const client = ${model.Name}SDK.make({
     endpoint: process.env.${model.NAME}_ENDPOINT,
     apikey: process.env.${model.NAME}_APIKEY,
  })

  let out = await client.Geofence().load({id:'CF49B47C-317B-4387-83C3-4A23715B1C45'})
  console.log('Geofence.load', out) 

  out = await client.Geofence().list()
  console.log('Geofence.list', out) 

  // Run only if endpoint is localhost
  if (process.env.${model.NAME}_ENDPOINT.includes('localhost')) {
    // Update the geofence
    out = await client.Geofence().save({
      id: 'CF49B47C-317B-4387-83C3-4A23715B1C45',
      name: 'Geofence 1',
      desc: 'Geofence 1 description',
      custom: { foo: 'bar' },
      extent_id: 'CF49B47C-317B-4387-83C3-4A23715B1C45'
    })
    console.log('Geofence.save', out)
  }
}

`)

  })
})


export {
  Quick
}


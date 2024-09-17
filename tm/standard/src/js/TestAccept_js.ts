
import { cmp, each, File, Content } from '@voxgig/sdkgen'


import { TestAcceptEntity } from './TestAcceptEntity_js'


const TestAccept = cmp(function TestMain(props: any) {
  const { build } = props
  const { model } = props.ctx$


  File({ name: model.Name + 'SDK.accept.test.' + build.name }, () => {

    Content(`
const { test, describe } = require('node:test')
const { equal, deepEqual } = require('node:assert')

const { ${model.Name}SDK } = require('../../')


describe('${model.Name}SDK Acceptance Tests', ()=>{
  test('happy', async ()=>{
    const client = makeClient()
    const out = await client.Geofence().load({id:'gf01'})
    console.log('Geofence.load', out)
    equal(out.data.id,'gf01')
  })

`)

    each(model.main.sdk.entity, (entity: any) => {
      TestAcceptEntity({ model, build, entity })
    })


    Content(`
})


function makeClient(config) {
  const client = ${model.Name}SDK.make({
    endpoint: process.env.${model.NAME}_ENDPOINT,
    apikey: process.env.${model.NAME}_APIKEY,
    ...config
  })

  return client
}

`)

  })
})


export {
  TestAccept
}


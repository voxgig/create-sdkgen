
import { names, getx, cmp, File, Content } from '@voxgig/sdkgen'


const Quick = cmp(function Quick(props: any) {
  const { build } = props
  const { model, meta: { spec } } = props.ctx$

  // get quick entity from build config

  // console.log('CONFIG 2')
  // console.dir(spec.config, { depth: null })


  let ent = getx(spec.config.guideModel, 'guide entity?test:quick:active=true')
  // .find((ent: any) => ent.test.quick.active)

  ent = ent || {}
  names(ent, ent.key$ || 'name')


  File({ name: 'quick.' + build.name }, () => {

    Content(`
// ENT 3
require('dotenv').config({ path: ['../../.env.local']})

const { ${model.Name}SDK } = require('../')

run()

async function run() {
  const client = ${model.Name}SDK.make({
    endpoint: process.env.${model.NAME}_ENDPOINT,
    apikey: process.env.${model.NAME}_APIKEY,
  })

  let out

`)

    if (ent.test?.quick.create) {
      Content(`    
  out = await client.${ent.Name}().create(${JSON.stringify(ent.test?.quick.create)})
  console.log('${ent.Name}.load', out) 
`)
    }

    if (ent.test?.quick.load) {
      Content(`    
  out = await client.${ent.Name}().load(${JSON.stringify(ent.test?.quick.load)})
  console.log('${ent.Name}.load', out) 
`)
    }

    if (ent.test?.quick.list) {
      Content(`    
  out = await client.${ent.Name}().list(${JSON.stringify(ent.test?.quick.list)})
  console.log('${ent.Name}.list', out)
`)
    }

    Content(`
}
`)

  })
})


export {
  Quick
}


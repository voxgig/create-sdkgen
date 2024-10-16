
import { names, getx, each, cmp, File, Content } from '@voxgig/sdkgen'


const Quick = cmp(function Quick(props: any) {
  const { build } = props
  const { model, meta: { spec } } = props.ctx$

  // get quick entity from build config


  let entmap = getx(spec.config.guideModel, 'guide entity?test:quick:active=true')
  let ent: any = Object.values(entmap)[0]
  ent.name = Object.keys(entmap)[0]

  ent = ent || {}
  names(ent, ent.name)// , ent.key$ || 'name')

  // TODO: selected features should be active by default!

  const featureOptions = each(model.main.sdk.feature)
    .filter((f: any) => f.active)
    .reduce((a: any, f: any) => a + `\n    ${f.name}: { active: true },`, '')

  // console.log('QUICK', ent, featureOptions)


  File({ name: 'quick.' + build.name }, () => {

    Content(`
// ENT 3
require('dotenv').config({ path: ['../../.env.local']})

const { ${model.Name}SDK } = require('../')

const { SimpleSpanProcessor, BasicTracerProvider, ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = require('@opentelemetry/semantic-conventions');

run()

async function run() {

  const provider = new BasicTracerProvider({ 
    resource: new Resource({ [ATTR_SERVICE_NAME]: 'plantquest-sdk', [ATTR_SERVICE_VERSION]: '1.0.0' })
  });

  const otlpExporter = new OTLPTraceExporter({
    url: process.env.TELEMETRY_ENDPOINT,
  });

  provider.addSpanProcessor(new SimpleSpanProcessor(otlpExporter));
  // provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  provider.register();


  const client = ${model.Name}SDK.make({
    endpoint: process.env.${model.NAME}_ENDPOINT,
    apikey: process.env.${model.NAME}_APIKEY,
    debug: true,
    ${featureOptions}
  })

  let out

`)

    if (ent.test?.quick.create) {
      Content(`    
  out = await client.${ent.Name}().create(${JSON.stringify(ent.test?.quick.create)})
  console.log('${ent.Name}.create', out) 
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


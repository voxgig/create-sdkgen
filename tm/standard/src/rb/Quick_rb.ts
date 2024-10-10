
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

  File({ name: "quick.rb" }, () => {
    Content(`
require 'dotenv'
Dotenv.load
require_relative '../lib/${model.name}_sdk'

def run

  client = ${model.Name}SDK.new(
    {
      endpoint: ENV['${model.NAME}_ENDPOINT'],
      apikey: ENV['${model.NAME}_APIKEY'],
      debug: true, 
      page: {
        debug: true
      }
    }
  )
`) 

  if(ent.test?.quick.list) {
  Content(`
  # List operation
  out = client.${ent.Name}.list(${JSON.stringify(ent.test?.quick.list)})
  puts "${ent.Name} listed:"
  out.each do |client|
    puts client.data.to_s
  end
  `)
  }

  if(ent.test?.quick.load) {
  Content(`
  # Load operation
  out = client.${ent.Name}.load(${JSON.stringify(ent.test?.quick.load)})
  puts "${ent.Name} loaded: #{out.data}"
  `)
  }

  if(ent.test?.quick.create) {
  Content(`
  # Create operation
  out = client.${ent.Name}.create(
    ${JSON.stringify(ent.test?.quick.create)}
  )
  puts "${ent.Name} created: #{out.data}"
  `)
  }

  if(ent.test?.quick.save) {
    Content(`
    # Update operation
    ent = client.${ent.Name}()
    ent.data({
      ${JSON.stringify(ent.test?.quick.save)}
    })
    out = ent.save()
    puts "${ent.Name} saved: #{out.data}"
    `)
  }

  if(ent.test?.quick.remove) {
    Content(`
    # Remove operation
    out = client.${ent.Name}.remove({${JSON.stringify(ent.test?.quick.remove)}})
    puts "${ent.Name} removed: #{out.data}"
    `)
  }

    Content(`
end

run
    `);

  });
});

export { Quick };

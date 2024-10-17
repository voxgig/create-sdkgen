
import {
  names,
  cmp,
  each,

  Project,
  Folder,
  Fragment,
  File,
  Content,

} from 'jostraca'



const ModelSdk = cmp(function ModelSdk(props: any) {
  const { ctx$, ctx$: { model } } = props


  // console.log('ModelSdk 2', model)

  // TODO: use apidef
  // const def = ctx$.fs.readFileSync(model.def.filepath)


  File({ name: 'sdk.jsonic' }, () => {
    Content(`

@"../node_modules/@voxgig/sdkgen/model/sdkgen.jsonic"

name: '${model.name}'

@"api.jsonic"
@"def.jsonic"

main: sdk: build: &: { name: .$KEY }

main: sdk: build: js: @"js.jsonic"

main: sdk: build: rb: @"rb.jsonic"

main: sdk: build: py: @"py.jsonic"

main: sdk: build: php: @"php.jsonic"

main: sdk: build: go: @"go.jsonic"



main: sdk: test: quick: entity: name: foo


main: sdk: entity: $.main.api.entity



main: sdk: option: {

  endpoint: {
    kind: *String | string
    short: "${model.Name} API URL"
  }

  apikey: {
    kind: *String | string
    short: "${model.Name} API Key"
  }
  
  fetch: {
    kind: *Any | string
    publish: false
  }
}
`)


    each(model.feature).filter((feature: any) => feature.active).map((feature: any) => {

      Content(
        `
main: sdk: feature: ${feature.name}: {
  active: true
  config: {
`)

      Fragment({
        from:
          `${__dirname}/../../feature/standard/${feature.name}/${feature.name}-config.jsonic`,
        indent: '    '
      })

      Content(`
  } 
}

`)
    })

  })

})


export {
  ModelSdk
}

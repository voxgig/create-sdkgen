
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
  const { spec } = props


  File({ name: 'sdk.jsonic' }, () => {
    Content(`

@"../node_modules/@voxgig/sdkgen/model/sdkgen.jsonic"

name: '${spec.name}'
def: '${spec.def}'

@"api.jsonic"

main: sdk: entity: $.main.api.entity

main: sdk: option: $.main.api.entity

`)

  })

})


export {
  ModelSdk
}

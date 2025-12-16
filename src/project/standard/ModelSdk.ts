
import {
  cmp,
  File,
  Fragment,

} from 'jostraca'



const ModelSdk = cmp(function ModelSdk(props: any) {
  const { spec } = props


  File({ name: 'sdk.jsonic' }, () => {
    Fragment({
      from: __dirname + '/../../../project/standard/' + spec.sdk_folder +
        '/model/sdk.fragment.jsonic',
      replace: {
        ProjectName: spec.name,
        NAME: spec.name,
        DEF: spec.def,
      }
    })
  })

})


export {
  ModelSdk
}

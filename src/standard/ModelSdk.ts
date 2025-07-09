
import {
  cmp,
  File,
  Fragment,

} from 'jostraca'



const ModelSdk = cmp(function ModelSdk(props: any) {
  const { spec } = props


  File({ name: 'sdk.jsonic' }, () => {
    Fragment({
      from: __dirname + '/../../project/.sdk/model/sdk.fragment.jsonic',
      replace: {
        // TODO: should use ProjectName for consistency
        NAME: spec.name,
        DEF: spec.def,
      }
    })
  })

})


export {
  ModelSdk
}

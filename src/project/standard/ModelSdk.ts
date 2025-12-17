
import Path from 'node:path'


import {
  cmp,
  File,
  Fragment,

} from 'jostraca'



const ModelSdk = cmp(function ModelSdk(props: any) {
  const { spec } = props

  const from =
    Path.resolve(Path.join(__dirname + '..', '..', '..', '..', 'project', 'standard'))

  File({ name: 'sdk.jsonic' }, () => {
    Fragment({
      from: Path.join(from, spec.sdk_folder, 'model', 'sdk.fragment.jsonic'),
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

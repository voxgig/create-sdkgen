
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

# Defaults and type definitions
@"@voxgig/apidef/model/apidef.jsonic"
@"@voxgig/sdkgen/model/sdkgen.jsonic"


# SDK Details
name: '${spec.name}'
def: '${spec.def}'


# Generated API description (from external specificaton).
@"api-generated.jsonic"


# Original external specification.
@"def-generated.jsonic"


# Generation guide.
main: guide: @"guide.jsonic"


# SDK Target details.
main: sdk: target: {}


# SDK Entity details.
main: sdk: entity: {}


# SDK Faeture details.
main: sdk: feature: {}


`)

  })

})


export {
  ModelSdk
}

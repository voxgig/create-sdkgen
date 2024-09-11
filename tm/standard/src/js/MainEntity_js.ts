

import { cmp, each, File, Code } from '@voxgig/sdkgen'


const MainEntity = cmp(async function MainEntity(props: any) {
  const { entity } = props

  Code(`
  ${entity.Name}(data) {
    const self = this
    return new ${entity.Name}(self,data)
  }

`)

})


export {
  MainEntity
}

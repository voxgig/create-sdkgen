

import { cmp, each, File, Content } from '@voxgig/sdkgen'


const MainEntity = cmp(async function MainEntity(props: any) {
  const { entity } = props

  Content(`
  ${entity.Name}(data) {
    const self = this
    return new ${entity.Name}(self,data)
  }

`)

})


export {
  MainEntity
}

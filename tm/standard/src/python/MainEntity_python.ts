import { cmp, each, File, Code } from '@voxgig/sdkgen'


const MainEntity = cmp(async function MainEntity(props: any) {
  const { entity } = props

  const def = JSON.stringify(entity)

  Code(`
    def ${entity.Name}(self):
        return ${entity.Name}(self, json.loads('''${def}'''))
`)

})


export {
  MainEntity
}


import { cmp, Code } from '@voxgig/sdkgen'


const MainEntity = cmp(async function MainEntity(props: any) {
  const { model, entity } = props

  Code(`
func (m *${model.name}) ${entity.Name}(data ...${entity.Name}Data) *${entity.name} {
  e := new (${entity.name})
  e.sdk = func () *${model.name} {return m}
  if data != nil {
    e.Data = data[0]
  }
  e.def = map[string]any{
    "name": "${entity.name}",
  }
  return e
}
`)
})


export {
  MainEntity
}

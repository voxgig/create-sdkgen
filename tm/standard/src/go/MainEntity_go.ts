
import { cmp, Content } from '@voxgig/sdkgen'


const MainEntity = cmp(async function MainEntity(props: any) {
  const { model, entity } = props

  Content(`
func (m *${model.name}) ${entity.Name}(data ...${entity.Name}Data) *${entity.Name} {
  e := new (${entity.Name})
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

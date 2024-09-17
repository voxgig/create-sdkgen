
import { cmp, camelify, Content } from '@voxgig/sdkgen'


const TestEntity = cmp(function TestEntity(props: any) {
  const { entity } = props

  entity.Name = camelify(entity.name)

  Content(`
  test('${entity.name}-load', async ()=>{
    const client = makeClient()
    const out = await client.${entity.Name}().load({id:'t01'})
    console.log('${entity.name}-load', out)
    deepEqual(out.data,{id:'t01',title:'T01'})
  })

`)
})


export {
  TestEntity
}

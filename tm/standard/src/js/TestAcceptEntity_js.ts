
import { cmp, camelify, Code } from '@voxgig/sdkgen'


const TestAcceptEntity = cmp(function TestEntity_js(props: any) {
  const { entity } = props

  entity.Name = camelify(entity.name)

  Code(`
    test('${entity.name}-load', async ()=>{
      const client = makeClient()
      const out = await client.${entity.Name}().load({id:'t01'})
      //console.log('${entity.name}-load', 'out', out)

      // equal(out.status, 200, 'Expected status code 200');

      // Check out.data is an object
      equal(typeof out.data, 'object', 'Expected data to be an object');

      // Check out.data has id
      equal(typeof out.data.id, 'string', 'Expected data to have an id');

    })

    test('${entity.name}-list', async ()=>{
      const client = makeClient()
      const out = await client.${entity.Name}().list()
      //console.log('${entity.name}-list', 'out', out)

      // Check out is an array
      equal(Array.isArray(out), true, 'Expected an array');

      // Check out.data is an object
      equal(typeof out[0], 'object', 'Expected data to be an object');

      // Check out.data has id
      equal(typeof out[0].data.id, 'string', 'Expected data to have an id');
    })

`);
})


export {
  TestAcceptEntity
}
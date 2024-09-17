
import { cmp, camelify, Content } from '@voxgig/sdkgen'


const TestAcceptEntity = cmp(function TestEntity(props: any) {
  const { entity } = props

  entity.Name = camelify(entity.name)

  Content(`
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

    test('${entity.name}-create', async ()=>{
      const client = makeClient() 
      const out = await client.${entity.Name}().create(${JSON.stringify(generateObjectFromFields(entity.field))})
      //console.log('${entity.name}-create', 'out', out)

      // Check out is an object
      equal(typeof out, 'object', 'Expected an object');

      // Check out.data has id
      equal(typeof out.data.id, 'string', 'Expected data to have an id');
    })

    test('${entity.name}-save', async ()=>{
      const client = makeClient()
      const out = await client.${entity.Name}().save(${JSON.stringify(generateObjectFromFields(entity.field))})
      //console.log('${entity.name}-save', 'out', out)

      // Check out is an object
      equal(typeof out, 'object', 'Expected an object');

      // Check out.data has id
      equal(typeof out.data.id, 'string', 'Expected data to have an id'); 
    })

    test('${entity.name}-remove', async ()=>{
      const client = makeClient()
      const out = await client.${entity.Name}().remove({id:'t01'})
      //console.log('${entity.name}-remove', 'out', out)

      // Check out is an object
      equal(typeof out, 'object', 'Expected an object');
    })

`);
})

function generateObjectFromFields(fields: any) {
  const getRandomString = (length: number): string =>
    Array.from({ length }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62))).join('');

  const defaultValues: Record<string, any> = {
    number: Math.floor(Math.random() * 100),
    string: getRandomString(5),
    object: { [getRandomString(3)]: getRandomString(3) },
    boolean: Math.random() > 0.5,
    array: Array.from({ length: 3 }, () => getRandomString(3)),
  }

  const result: Record<string, any> = {}

  for (const key in fields) {
    result[key] = defaultValues[fields[key].type] ?? null;
  }

  return result
}


export {
  TestAcceptEntity
}

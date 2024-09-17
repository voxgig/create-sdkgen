
import { cmp, camelify, Content } from '@voxgig/sdkgen'


const TestEntity = cmp(function TestEntity(props: any) {
  const { entity } = props

  entity.Name = camelify(entity.name)

  // console.log(entity.op)

  // TODO: refactor via loop
  for (let key in entity.op) {
    // console.log(key)
  }

  Content(`
def test_${entity.name}():
    config = dotenv_values('.env.test.local')
    client = makeClient(config)

    # create
    out = client.${entity.Name}().create({ 'title': 'T03' })
    print('create', out)
    assert out == {'id': 'n03', 'title': 'T03'}

    # save
    out = client.${entity.Name}().save({ 'id': 'n03', 'title': 'T03_3'})
    print('save', out)
    assert out == { 'id': 'n03', 'title': 'T03_3' }

    # load
    out = client.${entity.Name}().load({ 'id': 't01' })
    print('load', out)
    assert out == {'id': 't01', 'title': 'T01'}

    # list
    out = client.${entity.Name}().list()
    assert out['list'] != None and len(out['list']) != 0
    assert out['name'] == "${entity.name}"
    print('list', out)
    # raise Exception('4')

`)
})


export {
  TestEntity
}

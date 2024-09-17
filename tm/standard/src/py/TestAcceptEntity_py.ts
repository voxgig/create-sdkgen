import { cmp, camelify, Content } from '@voxgig/sdkgen'


const TestAcceptEntity = cmp(function TestAcceptEntity(props: any) {
  const { entity } = props

  entity.Name = camelify(entity.name)

  Content(`
def test_${entity.name}_load():
    config = dotenv_values('.env.test.local')
    client = makeClient(config)
    out = client.${entity.Name}().load({"id" :'t01'})

    expectedFormat = {
      'id': str,
      'name': str,
      'desc': str,
      'custom': dict,
    }

    print('load', out)

    for key in expectedFormat:
        assert expectedFormat[key] == type(out[key])


`);

  Content(`
def test_${entity.name}_list():
    config = dotenv_values('.env.test.local')
    client = makeClient(config)
    out = client.${entity.Name}().list()

    print('list', out)
    assert out['name'] == '${entity.name}' and len(out['list']) > 0

`);


})


export {
  TestAcceptEntity
}


import { cmp, camelify, Content } from '@voxgig/sdkgen'


const TestEntity = cmp(function TestEntity(props: any) {
  const { entity } = props

  entity.Name = camelify(entity.name)

  Content(`
func Test${entity.Name}List(t *testing.T) {
  endpoint := "http://test.com"
  apikey := "apikey"
  want := ${entity.Name}Data{
    Id: "${entity.name}t01",
    Name: "${entity.Name}T01",
  }

  var options Options
  options.Apikey = apikey
  options.Endpoint = endpoint
  client, err := Make(options)
  if err != nil {
    t.Fatalf("Error creating a new client ${entity.name} list: %q", err)
  }

  respData := strings.NewReader(\`{"list":[{"id":"${entity.name}t01"},
    {"id":"${entity.name}t02"}]}\`)
  httpClientMock := createHttpClientMock(respData)
  client.httpClient = *httpClientMock

  entities, err := client.${entity.Name}().List()
  if err != nil {
    t.Fatalf("Error running ${entity.name} list method: %q", err)
  }

  got := entities[0].Data
  if got.Id != want.Id {
    t.Fatalf("Error getting ${entity.name} list want %v and got %v", want, got)
  }
}

func Test${entity.Name}Load(t *testing.T) {
  endpoint := "http://test.com"
  apikey := "apikey"
  want := ${entity.Name}Data{
    Id: "${entity.name}t01",
  }

  var options Options
  options.Apikey = apikey
  options.Endpoint = endpoint
  client, err := Make(options)
  if err != nil {
    t.Fatalf("Error creating a new client ${entity.name} load: %q", err)
  }

  respData := strings.NewReader(fmt.Sprintf(\`{"id":"${entity.name}t01"}\`))
  httpClientMock := createHttpClientMock(respData)
  client.httpClient = *httpClientMock

  data := want
  client${entity.Name}, err := client.${entity.Name}().Load(data)
  if err != nil {
    t.Fatalf("Error running ${entity.name} load method: %q", err)
  }

  got := client${entity.Name}.Data
  if got.Id != want.Id {
    t.Fatalf("Error getting ${entity.name} load want %v and got %v", want.Id, got.Id)
  }
}
`)
})


export {
  TestEntity
}

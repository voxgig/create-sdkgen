
import { cmp, camelify, Code } from '@voxgig/sdkgen'


const TestEntity = cmp(function TestEntity_js(props: any) {
  const { entity } = props

  entity.Name = camelify(entity.name)

  Code(`
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
  client := NewClient(options)

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
  client := NewClient(options)

  respData := strings.NewReader(fmt.Sprintf(\`{"id":"${entity.name}t01"}\`))
  httpClientMock := createHttpClientMock(respData)
  client.httpClient = *httpClientMock

  data := want
  ${entity.name}, err := client.${entity.Name}().Load(data)
  if err != nil {
    t.Fatalf("Error running ${entity.name} load method: %q", err)
  }

  got := ${entity.name}.Data
  if got.Id != want.Id {
    t.Fatalf("Error getting ${entity.name} load want %v and got %v", want.Id, got.Id)
  }
}
`)
})


export {
  TestEntity
}

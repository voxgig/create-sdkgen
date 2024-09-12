
import { cmp, camelify, Code } from '@voxgig/sdkgen'


const TestAcceptEntity = cmp(function TestEntity_go(props: any) {
  const { entity, ctx$: { model } } = props

  entity.Name = camelify(entity.name)

  Code(`
func Test${entity.Name}AcceptList(t *testing.T) {
  err := godotenv.Load()
  if err != nil {
    t.Fatal("Error loading .env file for Test${entity.Name}AcceptList")
  }
  endpoint := os.Getenv("${model.NAME}_ENDPOINT")
  apikey := os.Getenv("${model.NAME}_APIKEY")

  var options ${model.name}.Options
  options.Apikey = apikey
  options.Endpoint = endpoint
  client := ${model.name}.NewClient(options)

  entities, err := client.${entity.Name}().List()
  if err != nil {
    t.Fatalf("Error running ${entity.name} list method: %v", err)
  }

  if len(entities) == 0 {
    t.Fatalf("Error getting ${entity.name} accept list length == 0 and got %v", 
     len(entities))
  }

  got := entities[0].Data

  if got.Id == "" {
    t.Fatal("Error getting ${entity.name} accept list - id equal to empty string")
  }
}


func Test${entity.Name}AcceptLoad(t *testing.T) {
  err := godotenv.Load()
  if err != nil {
    t.Fatal("Error loading .env file for Test${entity.Name}AcceptLoad")
  }
  endpoint := os.Getenv("${model.NAME}_ENDPOINT")
  apikey := os.Getenv("${model.NAME}_APIKEY")

  var options ${model.name}.Options
  options.Apikey = apikey
  options.Endpoint = endpoint
  client := ${model.name}.NewClient(options)

  data := ${model.name}.${entity.Name}Data{
    Id: "t01",
  }

  ${entity.name}, err := client.${entity.Name}().Load(data)
  if err != nil {
    t.Fatalf("Error running ${entity.name} load method: %v", err)
  }

  got := ${entity.name}.Data
  
  if got.Id == "" {
    t.Fatal("Error getting ${entity.name} accept load - id equal to empty string") 
  }
}
`);
})


export {
  TestAcceptEntity
}

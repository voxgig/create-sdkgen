
import { cmp, each, camelify, Content } from '@voxgig/sdkgen'


const TestAcceptEntity = cmp(function TestAcceptEntity(props: any) {
  const { model, entity } = props

  entity.Name = camelify(entity.name)

  const valueMap: Record<string, any> = {
    "custom": "map[string]any{\"test\": \"test\"}",
    "xval": "rand.Float64()",
    "yval": "rand.Float64()",
    "zval": "rand.Float64()",
    "xlen": "rand.Int()",
    "ylen": "rand.Int()",
    "parent_xlen": "rand.Int()",
    "parent_xval": "rand.Float64()",
    "parent_xyangle": "rand.Float64()",
    "parent_ylen": "rand.Int()",
    "parent_yval": "rand.Float64()",
    "parent_zval": "rand.Float64()",
    "polygon": "struct{Points [][]float64}{[][]float64{{ 1.34},{12.33}}}",
    "has_parent": true,
    "primary": true,
  }

  Content(`
func Test${entity.Name}AcceptList(t *testing.T) {
  err := godotenv.Load()
  if err != nil {
    t.Fatal("Error loading .env file for Test${entity.Name}AcceptList")
  }
  endpoint := os.Getenv("${model.NAME}_ENDPOINT")
  apikey := os.Getenv("${model.NAME}_APIKEY")

  var options ${model.name}sdk.Options
  options.Apikey = apikey
  options.Endpoint = endpoint
  client, err := ${model.name}sdk.Make(options)
  if err != nil {
    t.Fatalf("Error creating a new client ${entity.name} list: %q", err)
  }

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

  var options ${model.name}sdk.Options
  options.Apikey = apikey
  options.Endpoint = endpoint
  client, err := ${model.name}sdk.Make(options)
  if err != nil {
    t.Fatalf("Error creating a new client ${entity.name} load: %q", err)
  }

  data := ${model.name}sdk.${entity.Name}Data{
    Id: "t01",
  }

  client${entity.Name}, err := client.${entity.Name}().Load(data)
  if err != nil {
    t.Fatalf("Error running ${entity.name} load method: %v", err)
  }

  got := client${entity.Name}.Data
  
  if got.Id == "" {
    t.Fatal("Error getting ${entity.name} accept load - id equal to empty string") 
  }
}

func Test${entity.Name}AcceptCreate(t *testing.T) {
  err := godotenv.Load()
  if err != nil {
    t.Fatal("Error loading .env file for Test${entity.Name}AcceptCreate")
  }
  endpoint := os.Getenv("${model.NAME}_ENDPOINT")
  apikey := os.Getenv("${model.NAME}_APIKEY")

  var options ${model.name}sdk.Options
  options.Apikey = apikey
  options.Endpoint = endpoint
  client, err := ${model.name}sdk.Make(options)
  if err != nil {
    t.Fatalf("Error creating a new client ${entity.name} create: %q", err)
  }

  data := ${model.name}sdk.${entity.Name}Data{
    `)
  each(entity.field, (field: any) => {
    const value = valueMap[field.name] ? valueMap[field.name] : field.type

    if (value == "string") {
      Content(`
    ${field.Name}: "test",
            `)
      return
    }
    Content(`
    ${field.Name}: ${value},
            `)
  })
  Content(`
  }

  client${entity.Name}, err := client.${entity.Name}().Create(data)
  if err != nil {
    t.Fatalf("Error running ${entity.name} create method: %v", err)
  }

  got := client${entity.Name}.Data
  
  if got.Id == "" {
    t.Fatal("Error getting ${entity.name} accept create - id equal to empty string") 
  }
}


func Test${entity.Name}AcceptSave(t *testing.T) {
  err := godotenv.Load()
  if err != nil {
    t.Fatal("Error loading .env file for Test${entity.Name}AcceptSave")
  }
  endpoint := os.Getenv("${model.NAME}_ENDPOINT")
  apikey := os.Getenv("${model.NAME}_APIKEY")

  var options ${model.name}sdk.Options
  options.Apikey = apikey
  options.Endpoint = endpoint
  client, err := ${model.name}sdk.Make(options)
  if err != nil {
    t.Fatalf("Error creating a new client ${entity.name} save: %q", err)
  }

  data := ${model.name}sdk.${entity.Name}Data{
    `)
  each(entity.field, (field: any) => {
    const value = valueMap[field.name] ? valueMap[field.name] : field.type

    if (value == "string") {
      Content(`
    ${field.Name}: "test",
            `)
      return
    }
    Content(`
    ${field.Name}: ${value},
            `)
  })
  Content(`
  }

  client${entity.Name}, err := client.${entity.Name}().Save(data)
  if err != nil {
    t.Fatalf("Error running ${entity.name} save method: %v", err)
  }

  got := client${entity.Name}.Data
  
  if got.Id == "" {
    t.Fatal("Error getting ${entity.name} accept create - id equal to empty string") 
  }
}

func Test${entity.Name}AcceptRemove(t *testing.T) {
  err := godotenv.Load()
  if err != nil {
    t.Fatal("Error loading .env file for Test${entity.Name}AcceptRemove")
  }
  endpoint := os.Getenv("${model.NAME}_ENDPOINT")
  apikey := os.Getenv("${model.NAME}_APIKEY")

  var options ${model.name}sdk.Options
  options.Apikey = apikey
  options.Endpoint = endpoint
  client, err := ${model.name}sdk.Make(options)
  if err != nil {
    t.Fatalf("Error creating a new client ${entity.name} remove: %q", err)
  }

  data := ${model.name}sdk.${entity.Name}Data{
    Id: "t01",
  }

  _, err = client.${entity.Name}().Remove(data)
  if err != nil {
    t.Fatalf("Error running ${entity.name} remove method: %v", err)
  }
}
`);
})


export {
  TestAcceptEntity
}

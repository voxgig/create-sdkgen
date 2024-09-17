
import { cmp, File, Content } from '@voxgig/sdkgen'


const Quick = cmp(function Quick(props: any) {
  const { build } = props
  const { model } = props.ctx$

  File({ name: 'quick_test.' + build.name }, () => {

    Content(`
package ${model.name}sdk

import (
  "log"
  "os"
  "strings"
  "testing"

  "github.com/joho/godotenv"
)

func TestQuick(t *testing.T) {
  err := godotenv.Load()
  if err != nil {
    t.Fatal("Error loading .env file for Quick test") 
  }

  endpoint := os.Getenv("${model.NAME}_ENDPOINT")
  apikey := os.Getenv("${model.NAME}_APIKEY")

  var options Options
  options.Apikey = apikey
  options.Endpoint = endpoint
  client, err := Make(options)
  if err != nil {
    t.Fatalf("Error creating a new client Quick: %q", err)
  }

  data := GeofenceData{
    Id: "CF49B47C-317B-4387-83C3-4A23715B1C45",
  }

  out, err := client.Geofence().Load(data)
  if err != nil {
    t.Fatalf("Error running Quick load method: %q", err)
  }
  log.Print("Geofence.load", out.Data)

  out2, err := client.Geofence().List()
  if err != nil {
    t.Fatalf("Error running Quick list method: %q", err)
  }
  log.Print("Geofence.list", out2[0].Data, out2[1].Data)

  if strings.Contains(endpoint, "localhost") {
    //Create Quick Test
    data := GeofenceData{
      Name: "Geofence 1",
      Desc: "Geofence 1 description",
      Extent_id: "CF49B47C-317B-4387-83C3-4A23715B1C45",
      Custom: map[string]any{
        "foo": "bar",
      },
    }
    out, err := client.Geofence().Create(data)
    if err != nil {
      t.Fatalf("Error running Quick create method: %q", err)
    }
    log.Print("Geofence.create", out.Data)

    //Save Quick Test
    data = GeofenceData{
      Id: "CF49B47C-317B-4387-83C3-4A23715B1C45",
      Name: "Geofence 1",
      Desc: "Geofence 1 description",
      Extent_id: "CF49B47C-317B-4387-83C3-4A23715B1C45",
      Custom: map[string]any{
        "foo": "bar",
      },
    }
    out, err = client.Geofence().Save(data)
    if err != nil {
      t.Fatalf("Error running Quick save method: %q", err)
    }
    log.Print("Geofence.save", out.Data)

    //Remove Quick Test
    data = GeofenceData{
      Id: "CF49B47C-317B-4387-83C3-4A23715B1C45",
    }
    out, err = client.Geofence().Remove(data)
    if err != nil {
      t.Fatalf("Error running Quick remove method: %q", err)
    }
    log.Print("Geofence.remove ", out)
  }
}
`)

  })
})


export {
  Quick
}


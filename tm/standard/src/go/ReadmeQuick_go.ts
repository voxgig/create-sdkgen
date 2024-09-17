
import { cmp, Content } from '@voxgig/sdkgen'


const ReadmeQuick = cmp(function ReadmeQuick(props: any) {
  const { build, ctx$: { model } } = props

  Content('```go')
  Content(`
package main

import (
  "log"
  "os"

  "${build.module.name}"
)

func main() {
  var options ${model.name}sdk.Options
  options.Apikey = os.Getenv("${model.NAME}_APIKEY")
  options.Endpoint = os.Getenv("${model.NAME}_ENDPOINT")

  client, err := ${model.name}sdk.Make(options)
  if err != nil {
    log.Fatal(err)
  }

  buildings, err := client.Building().List()
  if err != nil {
    log.Println("Error running building list:", err)
    return
  }

  log.Println("Buildings", buildings)
}
`)
  Content('```')

})


export {
  ReadmeQuick
}

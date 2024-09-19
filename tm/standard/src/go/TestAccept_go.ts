
import { cmp, each, File, Content } from '@voxgig/sdkgen'

import { TestAcceptEntity } from './TestAcceptEntity_go'


const TestAccept = cmp(function TestAccept(props: any) {
  const { build } = props
  const { model } = props.ctx$


  File({ name: model.name + 'sdk_accept_test.' + build.name }, () => {

    Content(`
package ${model.name}sdk_test

import (
  "math/rand"
  "testing"
  "os"

  "github.com/joho/godotenv"
  "github.com/${model.name}/${model.name}-sdk"
)
         `)

    each(model.main.sdk.entity, (entity: any) => {
      TestAcceptEntity({ model, build, entity })
    })

  })
})


export {
  TestAccept
}


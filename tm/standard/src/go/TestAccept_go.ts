
import { cmp, each, File, Code } from '@voxgig/sdkgen'

import { TestAcceptEntity } from './TestAcceptEntity_go'


const TestAccept = cmp(function TestMain_go(props: any) {
  const { build, ctx$: { model } } = props


  File({ name: model.name + 'sdk_accept_test.' + build.name }, () => {

    Code(`
package ${model.name}_test

import (
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


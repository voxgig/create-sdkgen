
import { cmp, each, File, Code } from '@voxgig/sdkgen'


import { TestEntity } from './TestEntity_go'


const TestMain = cmp(function TestMain_js(props: any) {
  const { build } = props
  const { model } = props.ctx$

  File({ name: model.name + 'sdk_test.' + build.name }, () => {

    Code(`
package ${model.name} 

import (
  "fmt"
  "testing"
  "net/http"
  "io"
  "strings"
)

// Mock HTTP Client Transport type.
// For more info, please see: https://pkg.go.dev/net/http#Client
// And: https://pkg.go.dev/net/http#RoundTripper
type fakeService func(*http.Request) (*http.Response, error)

func (s fakeService) RoundTrip(req *http.Request) (*http.Response, error) {
  return s(req)
}

func createHttpClientMock(respData *strings.Reader) *http.Client {
 return &http.Client{
  Transport: fakeService(func(*http.Request) (*http.Response, error) {
    return &http.Response{
      StatusCode: http.StatusOK,
      Header: http.Header{
        "Content-Type": []string{"application/json"},
      },
      Body: io.NopCloser(respData),
    }, nil
  }),
}}
`)

    each(model.main.sdk.entity, (entity: any) => {
      TestEntity({ model, build, entity })
    })
    Code(`
`)

  })
})


export {
  TestMain
}


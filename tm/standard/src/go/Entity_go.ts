
import { cmp, each, File, Code } from '@voxgig/sdkgen'


const Entity_go = cmp(function Entity_go(props: any) {
  const { build, entity } = props
  const { model } = props.ctx$

  File({ name: entity.name + '.' + build.name }, () => {
    const valueRelation: Record<string, string> = {
      "custom": "map[string]any",
      "xval": "float64",
      "yval": "float64",
      "zval": "float64",
      "polygon": "struct{Points [][]float64}"
    }

    Code(`
// ${model.Name} ${build.Name} ${entity.Name}

package ${model.name}

import (
  "fmt"
  "encoding/json"
  "io"
  "errors"
  "net/http"
)

type ${entity.Name}Data struct {`)
    each(entity.field, (field: any) => {
      const type = valueRelation[field.name] ? valueRelation[field.name] : field.type
      Code(`
  ${field.Name} ${type} \`json:"${field.name}"\`
            `)
    })
    Code(`
}

type ${entity.name} struct {
  Data ${entity.Name}Data
  def map[string]any
sdk func () *${model.name}
}

func (e *${entity.name}) reqSetup(op string, data ${entity.Name}Data) (*http.Request, error) {
  e.Data = data

  endpointConfig := endpointConfig{
    op: op,
    id: e.Data.Id,
    name: e.def["name"].(string),
    apiUrl: e.sdk().options.Endpoint,
  }

  fetchConfig := fetchConfig{
    op: op,
    url: endpoint(endpointConfig),
    apikey: e.sdk().options.Apikey,
  }

  spec, err := fetchSpec(fetchConfig, e.Data)
  if err != nil {
    return nil, err
  }

  req, err := http.NewRequest(spec.method, spec.url, spec.body)
  if err != nil {
    return nil, err
  }

  req.Header.Set("Content-Type", spec.contentType)
  req.Header.Set("Authorization", spec.authorization)

  return req, nil
}

func (e *${entity.name}) handleResult(op string, res *http.Response,
  handler func(${entity.Name}Data) *${entity.name}) (*${entity.name}, error) {
  var result ${entity.Name}Data
  status := res.StatusCode

  if status == 200 {
    resBody, err := io.ReadAll(res.Body)
    if err != nil {
      return nil, err
    }

    if err = json.Unmarshal(resBody, &result); err != nil {
      return nil, err
    }
    return handler(result), nil
  }

  return nil, errors.New(fmt.Sprintf("HTTP-ERROR: %v: ${entity.name}: %v",
    op, status))
}

`)
    each(entity.op, (op: any) => {
      if (op.name == "list") {
        Code(`
func (e *${entity.name}) ${op.Name}() ([]*${entity.name}, error) {
  type entity${op.Name} struct {
    ${op.Name} []${entity.Name}Data
  }

  op := "${op.name}"
  var entities []*${entity.name}

  endpointConfig := endpointConfig{
    op: op,
    id: e.Data.Id,
    name: e.def["name"].(string),
    apiUrl: e.sdk().options.Endpoint,
  }

  fetchConfig := fetchConfig{
    op: op,
    url: endpoint(endpointConfig),
    apikey: e.sdk().options.Apikey,
  }

  spec, err := fetchSpec(fetchConfig, e.Data)
  if err != nil {
    return nil, err
  }

  req, err := http.NewRequest(spec.method, spec.url, spec.body)
  if err != nil {
    return nil, err
  }

  req.Header.Set("Content-Type", spec.contentType)
  req.Header.Set("Authorization", spec.authorization)

  res, err := e.sdk().httpClient.Do(req)
  if err != nil {
    return nil, err
  }
  defer res.Body.Close()

  status := res.StatusCode

  if status == 200 {
    resBody, err := io.ReadAll(res.Body)
    if err != nil {
      return nil, err
    }

    var entity${op.Name} entity${op.Name}
    if err = json.Unmarshal(resBody, &entity${op.Name}); err != nil {
      return nil, err
    }

    for _, entityData := range entity${op.Name}.${op.Name} {
      entity := e.sdk().${entity.Name}(entityData)
      entities = append(entities, entity)
    }

    return entities, nil
  }

  return nil, errors.New(fmt.Sprintf("HTTP-ERROR: %v: ${entity.name}: %v",
    op, status))
}
`)
        return
      } else if (op.name == "remove") {
        Code(`
func (e *${entity.name}) ${op.Name}(data ${entity.Name}Data) (*${entity.name}, error) {
  op := "${op.name}"

  req, err := e.reqSetup(op, data)
  if err != nil {
    return nil, err
  }

  res, err := e.sdk().httpClient.Do(req)
  if err != nil {
    return nil, err
  }
  defer res.Body.Close()

  handler := func(data ${entity.Name}Data) *${entity.name} {
    e.Data = data
    return nil
  }

  return e.handleResult(op, res, handler)
}
`)
        return
      }
      Code(`
func (e *${entity.name}) ${op.Name}(data ${entity.Name}Data) (*${entity.name}, error) {
  op := "${op.name}"

  req, err := e.reqSetup(op, data)
  if err != nil {
    return nil, err
  }

  res, err := e.sdk().httpClient.Do(req)
  if err != nil {
    return nil, err
  }
  defer res.Body.Close()

  handler := func(data ${entity.Name}Data) *${entity.name} {
    e.Data = data
    return e
  }

  return e.handleResult(op, res, handler)
}
`)
    });
  })
})


export {
  Entity_go
}

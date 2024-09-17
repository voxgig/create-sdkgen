
import { cmp, each, File, Content } from '@voxgig/sdkgen'


const Entity = cmp(function Entity(props: any) {
  const { build, entity } = props
  const { model } = props.ctx$

  File({ name: entity.name + '.' + build.name }, () => {
    const complexTypeMap: Record<string, string> = {
      "custom": "map[string]any",
      "xval": "float64",
      "yval": "float64",
      "zval": "float64",
      "xlen": "int",
      "ylen": "int",
      "parent_xlen": "int",
      "parent_xval": "float64",
      "parent_xyangle": "float64",
      "parent_ylen": "int",
      "parent_yval": "float64",
      "parent_zval": "float64",
      "polygon": "struct{Points [][]float64}",
    }

    const defaultTypeMap: Record<string, string> = {
      "boolean": "bool",
      "string": "string"
    }

    Content(`
// ${model.Name} ${build.Name} ${entity.Name}

package ${model.name}sdk

import (
  "fmt"
  "encoding/json"
  "io"
  "errors"
  "net/http"
)

type ${entity.Name}Data struct {`)
    each(entity.field, (field: any) => {
      const type = complexTypeMap[field.name] ? complexTypeMap[field.name]
        : defaultTypeMap[field.type]
      Content(`
  ${field.Name} ${type} \`json:"${field.name}"\`
            `)
    })
    Content(`
}

type ${entity.Name} struct {
  Data ${entity.Name}Data
  def map[string]any
  sdk func () *${model.name}
}

func (e *${entity.Name}) reqSetup(op string, data ${entity.Name}Data) (*http.Request, error) {
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

func (e *${entity.Name}) handleResult(op string, res *http.Response,
  handler func(${entity.Name}Data) *${entity.Name}) (*${entity.Name}, error) {
  var result ${entity.Name}Data
  status := res.StatusContent

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
        Content(`
func (e *${entity.Name}) ${op.Name}() ([]*${entity.Name}, error) {
  type entity${op.Name} struct {
    ${op.Name} []${entity.Name}Data
  }

  op := "${op.name}"
  var entities []*${entity.Name}

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

  status := res.StatusContent

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
      }
      Content(`
func (e *${entity.Name}) ${op.Name}(data ${entity.Name}Data) (*${entity.Name}, error) {
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

  handler := func(data ${entity.Name}Data) *${entity.Name} {
    e.Data = data
          `)
      if (op.name == "remove") {
        Content(`
    return nil
  }
  return e.handleResult(op, res, handler)
}
  `)
        return
      }
      Content(`
    return e
  }

  return e.handleResult(op, res, handler)
}
`)
    });
  })
})


export {
  Entity
}

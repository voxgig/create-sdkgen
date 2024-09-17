

import { cmp, each, camelify, File, Content, Folder, Copy } from '@voxgig/sdkgen'

import { MainEntity } from './MainEntity_py'
import { Test } from './Test_py'


const config_setup_files = [
  'setup.py',
  'pyproject.toml',
  'requirements.txt',
  'setup.cfg',
  'MANIFEST.in',
  'Makefile',
  'pytest.ini'
]

const Main = cmp(async function Main(props: any) {
  const { build } = props
  const { model } = props.ctx$

  const entity = model.main.sdk.entity


  Test({ build })

  for (let config_file of config_setup_files) {
    Copy({ from: 'tm/' + build.name + '/' + config_file, name: config_file })
  }

  File({ name: '.env.test.local' }, () => {
    Content(`
PLANTQUEST_ENDPOINT=example.com
PLANTQUEST_ENDPOINT_PRISM=http://127.0.0.1:4010/a/b/c
PLANTQUEST_APIKEY=pqapikey
`)

  })

  Folder({ name: 'src/' + model.name + '_sdk' }, () => {

    File({ name: '__init__.py' }, () => {
      Content(`from .${model.Name}SDK import *
from .Model import Config
from .Model import Data
from .Model import Query

`)

      each(entity, (entity: any) => {
        entity.Name = camelify(entity.name)
        // console.log('entity.Name: ', entity)
        Content(`from .${entity.Name} import ${entity.Name}
`)

      })

      Content(`__doc__ = 'An example SDK'
`)


    })

    File({ name: 'Model.py' }, () => {
      Content(`
from typing import Any, Callable

from pydantic import BaseModel, Field, ConfigDict, ValidationError


class Config(BaseModel):
    endpoint: str = Field(validate_default=True)
    apikey: str = Field(validate_default=True)
    fetch: Callable = Field(validate_default=True)

    model_config = ConfigDict(extra='allow')

class Data(BaseModel):
    id: str = Field(default=None, validate_default=False)
    model_config = ConfigDict(extra='allow')

class Query(BaseModel):
    id: str = Field(default=None, validate_default=False)
    model_config = ConfigDict(extra='allow')

`)

    })


    File({ name: model.Name + 'SDK.' + build.extension }, () => {

      /*
      const validate_options = each(build.options)
        .reduce((a: string, opt: any) =>
          a + ('String' === opt.kind ?
            `        required(str, '${opt.name}', options)\n` : ''), '')
      */

      const imports = `
import json

`
      Content(`${imports}`)

      each(entity, (entity: any) => {
        entity.Name = camelify(entity.name)
        Content(`from .${entity.Name} import ${entity.Name}
`)
      })


      /*
      // Replaced by pydantic
      Content(`
def required(type_class, name, options):
    val = options[name]
    if(type_class != type(val)):
        raise Exception('${model.Name}SDK: Invalid option: '+name+'='+val+': must be of type '+ str(type_class))

`)
*/

      Content(`

from pydantic import BaseModel
# from .Model import Data

# ${model.Name} ${build.Name} SDK


class ${model.Name}SDK:
    def __init__(self, options):
        self.options = options


    @staticmethod
    def make(options):
        return ${model.Name}SDK(options)

    def endpoint(self, op, ent):
        data = ent.data
        id = None
        # print("ent.data: ", type(ent.data) == Data, isinstance(ent.data, Data), isinstance(ent.data, BaseModel))
        if dict == type(ent.data):
            id = ent.data.get('id')
        elif isinstance(ent.data, BaseModel):
            id = ent.data.id

        return (
            self.options.endpoint
            + "/"
            + ent.definition.get("name")
            + ((id and (op == 'load' or op == 'delete') and "/" + id) or "")
        )

    def method(self, op, ent=None):
        key = op
        if (None == ent or None == ent.id) and "save" == op:
            key = "create"

        if "create" == key:
            return "POST"
        elif "save" == key:
            return "PUT"
        elif "load" == key or "list" == key:
            return "GET"
        elif "remove" == key:
            return "DELETE"

    def body(self, op, ent):
        # msg = {}
        # msg.update(ent.data)
        # print('body ent.data: ', ent.data)

        if dict == type(ent.data):
            # return json.dumps(ent.data)
            return ent.data
        elif isinstance(ent.data, BaseModel):
            return ent.data.model_dump(exclude_none=True)
            # return ent.data.model_dump_json(exclude_none=True)


    def fetchSpec(self, op, ent):
        method = self.method(op, ent)
        spec = {
            "url": self.endpoint(op, ent),
            "method": method,
            "headers": {
                "content-type": "application/json",
                "authorization": "Bearer " + self.options.apikey,
            },
            "body": ("GET" == method and {}) or self.body(op, ent),
        }
        return spec

`)

      each(entity, (entity: any) => {
        MainEntity({ model, build, entity })
      })


    })
  })
})


export {
  Main
}

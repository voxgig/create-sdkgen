
import { cmp, each, File, Code } from '@voxgig/sdkgen'


import { TestEntity } from './TestEntity_python'


const TestMain = cmp(function TestMain_js(props: any) {
  const { build } = props
  const { model } = props.ctx$

  File({ name: 'Fetch.' + build.extension }, () => {

    Code(`
import json

def fetch(url, config):
    parts = url.split("/")
    # print('parts: ', parts)
    entname = None
    entid = None

    try:
        # TODO: PARTS DEPEND ON THE SWAGGERS: add logic
        # A utility for url parsing is needed
        entname = parts[1]
        entid = parts[2]
    except IndexError:
        pass

    data = json.loads(config.get("body") or "{}")
    method = config.get("method") or "GET"

    req = {
        "url": url,
        "parts": parts,
        "entname": entname,
        "entid": entid,
        "method": method,
        "data": data,
    }

    json_data = None
    if "GET" == method:
        if None != entid:
            json_data = {"id": entid, "title": "T01"}
        else:
            json_data = {
                "name": entname,
                "list": [{"id": "n01", "title": "N01"}, {"id": "n02", "title": "N02"}],
            }
    elif "PUT" == method or "POST" == method:
        if None != entid:
            json_data = { "id": entid, "title": data.get('title') }
        else:
            json_data = { "id": "n03", "title": data.get('title') or "T03" }

    return {"req": req, "status": 200, "json": json_data}
`)

  })

  File({ name: 'test_' + model.name + '_sdk.' + build.extension }, () => {

    Code(`
import json

from dotenv import dotenv_values

import ${model.name}_sdk

from ${model.name}_sdk import Config

from Fetch import fetch


def makeClient(config = {}):
    client = ${model.name}_sdk.${model.Name}SDK.make(Config(
        endpoint=config.get('${model.NAME}_ENDPOINT'),
        apikey=config.get('${model.NAME}_APIKEY'),
        fetch=fetch
    ))
    return client

`)
    Code(`
def test_happy():
    config = dotenv_values('.env.test.local')
    client = makeClient(config)
    `)
    each(model.main.sdk.entity, (entity: any) => {
      TestEntity({ model, build, entity })
    })


  })
})


export {
  TestMain
}


import { cmp, each, File, Content } from '@voxgig/sdkgen'


import { TestAcceptEntity } from './TestAcceptEntity_py'


const TestAccept = cmp(function TestAccept(props: any) {
  const { build } = props
  const { model } = props.ctx$


  File({ name: 'test_accept_' + model.Name + '.' + build.extension }, () => {

    Content(`
from pathlib import Path
import sys
path_root = str(Path(__file__).parents[1])
sys.path.append(path_root)

import json

import requests
from dotenv import dotenv_values

import plantquest_sdk

from plantquest_sdk import Config

# from Fetch import fetch

def fetch(url, config):

    method = config.get('method') or 'GET'
    headers = config.get('headers') or {}
    body = config.get('body') or {}

    res = None

    if method == 'GET':
        res = requests.get(url, headers=headers)
    elif method == 'POST':
        res = requests.post(url, headers=headers, json=body)
    elif method == 'PUT':
        res = requests.put(url, headers=headers, json=body)


    if res.status_code >= 200 and res.status_code < 300:
        return { "status": res.status_code, "json": res.json(), "res": res }

    return { "status": res.status_code }

def makeClient(config = {}):
    client = plantquest_sdk.PlantquestSDK.make(Config(
        endpoint=config.get('PLANTQUEST_ENDPOINT_PRISM'),
        apikey=config.get('PLANTQUEST_APIKEY') or 'abc123',
        fetch=fetch
    ))
    return client


def test_happy():
    config = dotenv_values('.env.test.local')
    client = makeClient(config)
`)

    each(model.main.sdk.entity, (entity: any) => {
      TestAcceptEntity({ model, build, entity })
    })

  })
})


export {
  TestAccept
}


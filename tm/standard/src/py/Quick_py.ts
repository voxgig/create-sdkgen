
import { cmp, File, Content } from '@voxgig/sdkgen'


const Quick = cmp(function Quick(props: any) {
  const { build } = props
  const { model } = props.ctx$

  File({ name: 'quick.' + build.extension }, () => {

    Content(`
from pathlib import Path
import sys
import json

import requests
from dotenv import dotenv_values

path_root = str(Path(__file__).parents[1]) + '/src' + '/${model.name}_sdk'
print('path_root: ', path_root)
sys.path.append(path_root)

import ${model.name}_sdk
import ${model.name}_sdk.Model as Model
from ${model.name}_sdk.Model import Data
from plantquest_sdk.Model import Query

# from Fetch import fetch

config = dotenv_values("../.env.test.local")


print("config: ", config, Model)


print(${model.name}_sdk.${model.Name}SDK)
print(dir(${model.name}_sdk))

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


if __name__ == "__main__":
    client = ${model.name}_sdk.${model.Name}SDK.make(Model.Config(
        endpoint=config.get('${model.NAME}_ENDPOINT_PRISM'),
        apikey=config.get('${model.NAME}_APIKEY'),
        fetch=fetch
    ))

    # load
    out = client.Geofence().load({"id": "CF49B47C-317B-4387-83C3-4A23715B1C45"})
    print("Geofence.load", out)

    # or
    out = client.Geofence().load(Query(id="CF49B47C-317B-4387-83C3-4A23715B1C45"))
    print("Geofence.load", out)

    # list
    out = client.Geofence().list()
    print("Geofence.list: ", out)

    # create
    out = client.Geofence().create(Data(
      id='CF49B47C-317B-4387-83C3-4A23715B1C45',
      name='Geofence 1',
      desc='Geofence 1 description',
      custom={ 'foo': 'bar' },
      extent_id='CF49B47C-317B-4387-83C3-4A23715B1C45'
    ))

    print('Geofence.create: ', out)

    # save
    out = client.Geofence().save(Data(
      id='CF49B47C-317B-4387-83C3-4A23715B1C45',
      name='Geofence 1',
      desc='Geofence 1 description',
      custom={ 'foo': 'bar' },
      extent_id='CF49B47C-317B-4387-83C3-4A23715B1C45'
    ))

    print('Geofence.save: ', out)

    '''
    # create
    out = client.Geofence().create(Data(
        title="T04",
        area=0,
    ))
    print("Geofence.create: ", out)

    # or
    out = client.Geofence().create({
        "title": "T05",
        "area": 0
    })
    print("Geofence.create: ", out)
    '''

    # remove
    out = client.Geofence().remove({"id": "CF49B47C-317B-4387-83C3-4A23715B1C45"})
    print("Geofence.remove: ", out)



`)

  })
})


export {
  Quick
}


import { cmp, File, Code } from '@voxgig/sdkgen'


const Quick = cmp(function Quick_python(props: any) {
  const { build } = props
  const { model } = props.ctx$

  File({ name: 'quick.' + build.extension }, () => {

    Code(`

from pathlib import Path
import sys
import json

from dotenv import dotenv_values

path_root = str(Path(__file__).parents[1]) + '/src' + '/${model.name}_sdk'
print('path_root: ', path_root)
sys.path.append(path_root)

import ${model.name}_sdk
import ${model.name}_sdk.Model as Model
from ${model.name}_sdk.Model import Data
from ${model.name}_sdk.Model import Query

from Fetch import fetch

config = dotenv_values("../.env.test.local")


print("config: ", config, Model)


print(${model.name}_sdk.${model.Name}SDK)
print(dir(${model.name}_sdk))


if __name__ == "__main__":
    client = ${model.name}_sdk.${model.Name}SDK.make(Model.Config(
        endpoint=config.get('${model.NAME}_ENDPOINT'),
        apikey=config.get('${model.NAME}_APIKEY'),
        fetch=fetch
    ))

    # load
    out = client.Geofence().load({"id": "CF49B47C-317B-4387-83C3-4A23715B1C45"})
    print("Geofence.load", out)

    # or
    out = client.Geofence().load(Query(id="CF49B47C-317B-4387-83C3-4A23715B1C45"))
    print("Geofence.load", out)

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



`)

  })
})


export {
  Quick
}

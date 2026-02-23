
import { size } from '@voxgig/struct'


import {
  Content,
  File,
  Folder,
  cmp,
  each,
} from '@voxgig/sdkgen'


import type {
  Model,
  ModelEntity,
  ModelField,
} from '@voxgig/apidef'


import {
  KIT,
  getModelPath,
  nom,
} from '@voxgig/apidef'


const BuildSDK = cmp(function BuildSDK(props: any) {
  const ctx$ = props.ctx$
  const model: Model = ctx$.model

  // TODO: should come from ctx$ options
  const sdkBuildFolder = '.sdk'

  const entityMap: ModelEntity = getModelPath(model, `main.${KIT}.entity`)

  Folder({ name: sdkBuildFolder }, () => {
    each(entityMap, (entity: ModelEntity) => {
      Folder({ name: 'test' }, () => {
        Folder({ name: 'entity' }, () => {
          Folder({ name: entity.name }, () => {
            File({ name: nom(entity, 'Name') + 'TestData.json' }, () => {
              const entityTestData = makeEntityTestData(model, entity)
              Content(JSON.stringify(entityTestData, null, 2))
            })
          })
        })
      })
    })
  })
})


function makeEntityTestData(_model: Model, entity: ModelEntity) {
  const data: any = {
    existing: {
      [entity.name]: {}
    },
    new: {
      [entity.name]: {}
    }
  }

  const idcount = 3

  const refs = [...Array(idcount).keys()].reduce((a, _x, i) =>
    (a.push(`${entity.name}${String(i).padStart(2, "0")}`), a), [] as string[])

  const idmap = refs.reduce((a: any, ref) => (a[ref] = ref.toUpperCase(), a), {})

  let i = 1

  refs.map((ref) => {
    const id = idmap[ref]
    const ent: any = data.existing[entity.name][id] = {}

    makeEntityTestFields(entity, i++, ent)
    ent.id = id
  })

  let id = entity.name + '_ref01'
  const ent: any = data.new[entity.name][id] = {}
  makeEntityTestFields(entity, i++, ent)
  delete ent.id

  return data
}


function makeEntityTestFields(entity: ModelEntity, start: number, entdata: Record<string, any>) {
  entdata = entdata ?? {}
  let num = (start * size(entity.fields) * 10)
  each(entity.fields, (field: ModelField) => {
    entdata[field.name] =
      field.name.endsWith('_id') ?
        field.name.substring(0, field.name.length - 3).toUpperCase() + '01' :
        'number' === field.type ? num :
          'boolean' === field.type ? 0 === num % 2 :
            'object' === field.type ? {} :
              'array' === field.type ? [] :
                's' + (num.toString(16))
    num++
  })
  return entdata
}


export {
  BuildSDK
}


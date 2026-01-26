
import { size } from '@voxgig/struct'



import {
  cmp, each, Line, File, Content, Folder
} from '@voxgig/sdkgen'


import type {
  ModelEntity
} from '@voxgig/apidef'

import {
  KIT,
  getModelPath,
  nom,
} from '@voxgig/apidef'


const BuildSDK = cmp(function BuildSDK(props: any) {
  const { ctx$ } = props
  const { model } = ctx$

  const entityMap: ModelEntity = getModelPath(model, `main.${KIT}.entity`)

  Folder({ name: '.sdk' }, () => {

    each(entityMap, (entity: ModelEntity) => {
      Folder({ name: 'test' }, () => {
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


function makeEntityTestData(model: any, entity: ModelEntity) {
  const data: any = {
    entity: {}
  }

  const refs = [
    `${entity.name}01`,
    `${entity.name}02`,
    `${entity.name}03`,
  ]

  const idmap = refs.reduce((a: any, ref) => (a[ref] = ref.toUpperCase(), a), {})

  refs.map((ref, i) => {
    const id = idmap[ref]
    const ent: any = data.entity[id] = {}

    let num = (i * size(entity.fields) * 10)
    each(entity.fields, (field: any) => {
      ent[field.name] =
        'number' === field.type ? num :
          'boolean' === field.type ? 0 === num % 2 :
            'object' === field.type ? {} :
              'array' === field.type ? [] :
                's' + (num.toString(16))
      num++
    })

    ent.id = id
  })

  return data
}


export {
  BuildSDK
}



import { size } from '@voxgig/struct'


import {
  Content,
  File,
  Folder,
  cmp,
  each,
} from '@voxgig/sdkgen'

import { camelify, lcf } from 'jostraca'


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

  // Path params required across the entity's ops (excluding the entity's own
  // id and any param renamed-to-id). The in-memory test mock's buildArgs
  // searches existing entities by these fields, so they need to be present
  // with values that match what the test code sends via setup.idmap.
  const pathParams = collectEntityPathParams(entity)

  const hasEntId = null != (entity as any).id
  const needsFixtureId = hasEntId || entityHasMutatingOp(entity)

  let i = 1

  refs.map((ref) => {
    const id = idmap[ref]
    const ent: any = data.existing[entity.name][id] = {}

    makeEntityTestFields(entity, i++, ent)
    for (const [paramName, paramValue] of pathParams) {
      // Don't overwrite a real entity field with the same name.
      if (ent[paramName] === undefined) {
        ent[paramName] = paramValue
      }
    }
    // Inject a fixture id when the spec models one for this entity (either
    // as a top-level field or as a path param). Read-only feeds with no id
    // at all leave fixtures bare so test generators don't synthesise bogus
    // id assertions.
    if (needsFixtureId) {
      ent.id = id
    }
  })

  let id = entity.name + '_ref01'
  const ent: any = data.new[entity.name][id] = {}
  makeEntityTestFields(entity, i++, ent)
  delete ent.id

  // WHICH operations this entity exposes, not what the specification says
  // about them. The facts are apidef's resolved definition, and copying them
  // here made the test data a second copy of the model's own copy of them.
  data.requests = {}
  for (const op of Object.values(entity.op || {}) as any[]) for (const point of op.points || []) {
    if (point.contract) data.requests[point.contract.id] = {
      provenance: 'operation-contract', version: point.contract.version,
      source: point.contract.source,
    }
  }
  return data
}


function entityHasMutatingOp(entity: any): boolean {
  const ops = entity?.op || {}
  for (const opname of Object.keys(ops)) {
    if (opname !== 'list') return true
  }
  return false
}


function collectEntityPathParams(entity: any): [string, string][] {
  const out = new Map<string, string>()
  const ops = entity?.op || {}
  for (const opname of Object.keys(ops)) {
    const op = ops[opname]
    const points = op?.points || []
    for (const point of points) {
      const params = point?.args?.params || []
      const renameMap: Record<string, string> = point?.rename?.param || {}
      for (const param of params) {
        if (!param?.name) continue
        if ('id' === param.name) continue
        // Skip params that ARE the entity's own id under URL rename.
        const camel = lcf(camelify(param.name))
        if ('id' === renameMap[camel]) continue
        if (out.has(param.name)) continue
        const baseName = param.name.replace(/_id$/, '')
        out.set(param.name, baseName.toUpperCase() + '01')
      }
    }
  }
  return Array.from(out.entries())
}


function makeEntityTestFields(entity: ModelEntity, start: number, entdata: Record<string, any>) {
  entdata = entdata ?? {}
  let num = (start * size(entity.fields) * 10)
  each(entity.fields, (field: ModelField) => {
    entdata[field.name] =
      field.name.endsWith('_id') ?
        field.name.substring(0, field.name.length - 3).toUpperCase() + '01' :
        ['`$NUMBER`', '`$INTEGER`'].includes(field.type) ? num :
          '`$BOOLEAN`' === field.type ? 0 === num % 2 :
            '`$OBJECT`' === field.type ? {} :
              '`$MAP`' === field.type ? {} :
                '`$ARRAY`' === field.type ? [] :
                  '`$LIST`' === field.type ? [] :
                    's' + (num.toString(16))
    num++
  })
  return entdata
}


export {
  BuildSDK
}


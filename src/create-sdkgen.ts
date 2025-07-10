/* Copyright (c) 2024-2025 Richard Rodger, MIT License */

import * as Fs from 'node:fs'
import Path from 'node:path'

import { prettyPino, Pino } from '@voxgig/util'

import * as JostracaModule from 'jostraca'



type FullCreateSdkGenOptions = {
  fs?: any
  debug?: boolean | string
  pino?: ReturnType<typeof Pino>

}

type CreateSdkGenOptions = Partial<FullCreateSdkGenOptions>


type GenerateSpec = {
  name: string // Name of SDK project.
  def: string // Path to OpenAPI definition file, copied into SDK project.
  root: string // Path to Root template component.
}


const { each, names, Jostraca } = JostracaModule


function CreateSdkGen(opts: FullCreateSdkGenOptions) {
  const fs = opts.fs || Fs
  const pino = prettyPino('create', opts)
  const log = pino.child({ cmp: 'create' })

  const jostraca = Jostraca()

  async function generate(spec: GenerateSpec) {
    const start = Date.now()

    log.info({ point: 'generate-start', start })
    log.debug({ point: 'generate-spec', spec, note: JSON.stringify(spec, null, 2) })

    const rootModule: any = require(spec.root)
    const Root = rootModule.Root

    const name = spec.name
    spec.def = (null == spec.def || '' === spec.def) ? name + '-openapi3.yml' : spec.def

    const folder = Path.join(process.cwd(), name + (name.endsWith('-sdk') ? '' : '-sdk'))

    const opts = {
      fs: () => fs,
      folder,
      log: log.child({ cmp: 'jostraca' }),
      meta: { spec },
      existing: {
        txt: {
          merge: true
        }
      }
    }

    const model = {
      name,
      project_name: name,
      year: new Date().getFullYear(),
    }

    names(model, model.name)
    names(model, model.name, 'project_name')

    log.debug({ point: 'generate-model', model, note: JSON.stringify(model, null, 2) })

    const info = await jostraca.generate(opts, () => Root({ model, spec }))

    logfiles(info, log)

    log.info({ point: 'generate-end' })
  }

  return {
    generate,
  }

}


function logfiles(info: any, log: ReturnType<typeof Pino>) {
  const cwd = process.cwd()

    ; Object.keys(info.files).map(action => {
      let entries = info.files[action]
      if (0 < entries.length) {
        log.info({
          point: 'file-' + action, entries,
          note: '\n' + entries.map((n: any) => n.replace(cwd, '.')).join('\n')
        })
      }
    })
}


export type {
  CreateSdkGenOptions,
}



export {
  CreateSdkGen,
}

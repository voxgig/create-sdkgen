/* Copyright (c) 2024-2025 Richard Rodger, MIT License */

import * as Fs from 'node:fs'
import Path from 'node:path'
import { spawn } from 'child_process'

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
  debug?: string
  dryrun?: boolean
  target?: string[]
  feature?: string[]
  install?: boolean
}


const { names, Jostraca } = JostracaModule


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
      },
      control: {
        dryrun: spec.dryrun
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

    if (!spec.dryrun && spec.install) {
      await installNpm(spec, opts, model)
    }

    log.info({ point: 'generate-end' })
  }

  return {
    generate,
  }

}


async function installNpm(spec: GenerateSpec, opts: any, model: any) {
  const folder = opts.folder
  const log = opts.log

  return new Promise((resolve, reject) => {
    const cwd = Path.resolve(folder, '.sdk')
    log.info({ point: 'generate-install', install: 'npm', note: 'npm install # ' + cwd })

    const env = {
      ...process.env,
      PATH: `${Path.dirname(process.execPath)}${Path.delimiter}${process.env.PATH}`,
    }

    const args = ['install']

    const spawn_opts: any = {
      cwd,
      env,
      stdio: 'inherit', // Direct passthrough for real-time output
    }

    const child = spawn('npm', args, spawn_opts)

    child.on('error', (err) => reject(new Error(`Failed to start npm: ${err.message}`)))

    child.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error(`npm install exited with code ${code}`))
      }
      else {
        await installTargets(spec, opts, model, spawn_opts)
        await installFeatures(spec, opts, model, spawn_opts)
        resolve(null)
      }
    })
  })
}


async function installTargets(spec: GenerateSpec, opts: any, model: any, spawn_opts: any) {
  const target = (spec.target as string[])

  if (null == target || 0 === target.length) {
    return
  }

  const log = opts.log
  return new Promise((resolve, reject) => {
    const targetlist = target.join(',')

    log.info({
      point: 'generate-target', target: targetlist,
      note: 'npm run target-add ' + targetlist
    })

    const args = ['run', 'add-target', targetlist]

    const child = spawn('npm', args, spawn_opts)

    child.on('error', (err) => reject(new Error(`Failed to start npm: ${err.message}`)))

    child.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error(`npm exited with code ${code}`))
      }
      else {
        resolve(null)
      }
    })
  })
}


async function installFeatures(spec: GenerateSpec, opts: any, model: any, spawn_opts: any) {
  const feature = (spec.feature as string[])

  if (null == feature || 0 === feature.length) {
    return
  }

  const log = opts.log
  return new Promise((resolve, reject) => {
    const featurelist = feature.join(',')

    log.info({
      point: 'generate-feature', feature: featurelist,
      note: 'npm run feature-add ' + featurelist
    })

    const args = ['run', 'add-feature', featurelist]

    const child = spawn('npm', args, spawn_opts)

    child.on('error', (err) => reject(new Error(`Failed to start npm: ${err.message}`)))

    child.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error(`npm exited with code ${code}`))
      }
      else {
        resolve(null)
      }
    })
  })

}


function logfiles(info: any, log: ReturnType<typeof Pino>) {
  const cwd = process.cwd()

    ; Object.keys(info.files).map(action => {
      let entries = info.files[action]
      if (0 < entries.length) {
        log.debug({
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

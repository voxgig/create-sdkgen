/* Copyright (c) 2024-2025 Richard Rodger, MIT License */

import * as Fs from 'node:fs'
import * as Os from 'node:os'
import Path from 'node:path'
import { spawn } from 'child_process'

import * as JostracaModule from 'jostraca'

import { showChanges, prettyPino, Pino } from '@voxgig/util'

import Pkg from '../package.json'


type FullCreateSdkGenOptions = {
  fs?: any
  debug?: boolean | string
  pino?: ReturnType<typeof Pino>

}

type CreateSdkGenOptions = Partial<FullCreateSdkGenOptions>


type GenerateSpec = {
  sdk_folder: string

  name: string // Name of SDK project.
  def: string // Path to OpenAPI definition file, copied into SDK project.
  root: string // Path to Root template component.
  project: string // Project template name
  debug?: string
  dryrun?: boolean
  target?: string[]
  feature?: string[]
  install?: boolean // perform installation - run npm install
  folder?: string // Target folder for project

}


const { names, Jostraca } = JostracaModule


const SDK_FOLDER = '.sdk'


// TODO: CreateSdkGen opts and generate opts should be mostly the same, and
// generate should override
function CreateSdkGen(opts: FullCreateSdkGenOptions) {
  const fs = opts.fs || Fs

  const debug = opts.debug
  const pino = prettyPino('create', opts)
  const log = pino.child({ cmp: 'create' })

  const jostraca = Jostraca()

  async function generate(spec: GenerateSpec) {
    const start = Date.now()

    let dryrun = !!spec.dryrun

    log.info({
      point: 'generate-start',
      start,
      note: spec.project + (dryrun ? ' ** DRY RUN **' : '')
    })
    log.debug({ point: 'generate-spec', spec, note: JSON.stringify(spec, null, 2) })

    const projectFolder = resolveProjectFolder(spec)
    const rootPath = Path.join(projectFolder, spec.root)

    const rootModule: any = require(rootPath)
    const CreateRoot = rootModule.CreateRoot

    const name = spec.name
    spec.def = (null == spec.def || '' === spec.def) ? name + '-openapi3.yml' : spec.def

    spec.sdk_folder = SDK_FOLDER

    const cwd = process.cwd()

    const folder = (null == spec.folder || '' == spec.folder) ?
      Path.join(cwd, name + (name.endsWith('-sdk') ? '' : '-sdk')) :
      Path.isAbsolute(spec.folder) ? spec.folder :
        Path.join(cwd, spec.folder)

    logCreate(folder)

    const jopts = {
      fs: () => fs,
      debug,
      folder,
      log: log.child({ cmp: 'jostraca' }),
      meta: { spec },
      existing: {
        txt: {
          merge: true
        }
      },
      control: {
        dryrun,
      }
    }

    const model = {
      name,
      project_name: name,
      project_kind: spec.project,
      year: new Date().getFullYear(),
      create_version: Pkg.version
    }

    names(model, model.name)
    names(model, model.name, 'project_name')

    log.debug({
      point: 'generate-jostraca',
      jostraca: jopts,
      note: JSON.stringify(jopts, null, 2)
    })

    const jres = await jostraca.generate(jopts, () => CreateRoot({ model, spec }))

    showChanges(jopts.log, 'generate-result', jres, Path.dirname(process.cwd()))

    if (spec.dryrun || !spec.install) {
      log.info({ point: 'generate-install', note: 'skipping npm install' })
    }

    if (!spec.dryrun) {
      await installNpm(spec, jopts, model)
    }

    log.info({ point: 'generate-end' })
  }


  function resolveProjectFolder(spec: GenerateSpec) {
    let projectFolder = spec.project

    if (Path.isAbsolute(projectFolder)) {
      return projectFolder
    }

    projectFolder = Path.resolve(Path.join(__dirname, 'project', spec.project))

    // TODO: support auto install project npm package (specific version) in a special cache folder

    if (!fs.existsSync(projectFolder)) {
      projectFolder = spec.project
    }

    return projectFolder
  }


  function escapeShellArg(arg: string): string {
    // If arg contains no special characters, return as-is
    if (/^[~a-zA-Z0-9_\-\.\/]+$/.test(arg)) {
      return arg
    }

    // Otherwise, wrap in single quotes and escape any single quotes
    return "'" + arg.replace(/'/g, "'\\''") + "'"
  }


  function logCreate(folder: string) {
    try {
      const logFolder = Path.join(folder, SDK_FOLDER, 'log')

      if (!fs.existsSync(logFolder)) {
        fs.mkdirSync(logFolder, { recursive: true })
      }

      const now = new Date()
      const utcTimestamp = '[' + now.toISOString() + ']'

      const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone
      const localISOString = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + 'T' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0') + '.' +
        String(now.getMilliseconds()).padStart(3, '0')
      const localTimestamp = timezoneName + '=' + localISOString

      const homeDir = Os.homedir()
      const command = process.argv
        .map(arg => arg.replace(homeDir, '~'))
        .map(escapeShellArg)
        .join(' ')

      const logLine = `${utcTimestamp}  ${localTimestamp}  CREATE  ${command}\n`

      const logFile = Path.join(logFolder, 'create.log')
      fs.appendFileSync(logFile, logLine, 'utf8')
    }
    catch (err) {
      log.debug({ point: 'logCreate-error', err })
    }
  }


  return {
    generate,
  }

}




async function installNpm(spec: GenerateSpec, opts: any, model: any) {
  const folder = opts.folder
  const log = opts.log

  return new Promise(async (resolve, reject) => {
    const cwd = Path.resolve(folder, SDK_FOLDER)

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

    const postInstall = async () => {
      await installTargets(spec, opts, model, spawn_opts)
      await installFeatures(spec, opts, model, spawn_opts)
    }

    if (spec.install) {
      log.info({ point: 'generate-install', note: 'running npm install in ' + cwd })

      const child = spawn('npm', args, spawn_opts)

      child.on('error', (err) => reject(new Error(`Failed to start npm: ${err.message}`)))

      child.on('close', async (code) => {
        if (code !== 0) {
          reject(new Error(`npm install exited with code ${code}`))
        }
        else {
          await postInstall()
          return resolve(null)
        }
      })
    }
    else {
      await postInstall()
      return resolve(null)
    }
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

    log.info({ point: 'generate-target', note: 'adding targets: ' + targetlist })
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

    log.info({ point: 'generate-feature', note: 'adding features: ' + featurelist })
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


/*
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
*/

export type {
  CreateSdkGenOptions,
}



export {
  CreateSdkGen,
}

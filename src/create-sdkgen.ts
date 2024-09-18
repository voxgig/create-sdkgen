/* Copyright (c) 2024 Richard Rodger, MIT License */

import * as Fs from 'node:fs'

import { FSWatcher } from 'chokidar'

import * as JostracaModule from 'jostraca'



type FullCreateSdkGenOptions = {
  folder: string
  fs: any
  model: any
  meta: any
  rootpath: string
}

type CreateSdkGenOptions = Partial<FullCreateSdkGenOptions>


const { Jostraca } = JostracaModule


function CreateSdkGen(opts: CreateSdkGenOptions) {
  const fs = opts.fs || Fs
  const folder = opts.folder || '.'
  const jostraca = Jostraca()
  const rootpath = opts.rootpath as string

  async function generate(spec: any) {
    // console.log('CreateSdkGen.generate', spec)

    const { model } = spec

    const ctx$ = { fs, folder, meta: { spec } }

    clear()
    const { Root } = require(rootpath)

    try {
      await jostraca.generate(ctx$, () => Root({ model }))
    }
    catch (err: any) {
      console.log('CREATE SDKGEN ERROR: ', err)
      throw err
    }
  }


  async function watch(spec: any) {
    const fsw = new FSWatcher()
    let last_change_time = 0

    await generate(spec)

    fsw.on('change', (args: any[]) => {
      // console.log('CHANGE', args)

      const dorun = 1111 < Date.now() - last_change_time

      if (dorun) {
        last_change_time = Date.now()
        generate(spec)
      }
    })

    spec.watch
      .map((wf: string) => (__dirname + '/' + wf))
      .map((wf: string) => (console.log(wf), wf))
      .map((wf: string) => fsw.add(wf))

    // generate()
  }


  function clear() {
    if (rootpath) {
      clearRequire(rootpath)
    }
  }


  return {
    generate,
    watch,
  }

}


// Adapted from https://github.com/sindresorhus/import-fresh - Thanks!
function clearRequire(path: string) {
  let filePath = require.resolve(path)

  if (require.cache[filePath]) {
    const children = require.cache[filePath].children.map(child => child.id)

    // Delete module from cache
    delete require.cache[filePath]

    for (const id of children) {
      clearRequire(id)
    }
  }


  if (require.cache[filePath] && require.cache[filePath].parent) {
    let i = require.cache[filePath].parent.children.length

    while (i--) {
      if (require.cache[filePath].parent.children[i].id === filePath) {
        require.cache[filePath].parent.children.splice(i, 1)
      }
    }
  }

}


export type {
  CreateSdkGenOptions,
}



export {
  CreateSdkGen,
}

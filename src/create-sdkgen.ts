/* Copyright (c) 2024 Richard Rodger, MIT License */

import * as Fs from 'node:fs'

import { FSWatcher } from 'chokidar'

import * as JostracaModule from 'jostraca'



type FullCreateSdkGenOptions = {
  folder: string
  fs: any
  model: any
  meta: any
}

type CreateSdkGenOptions = Partial<FullCreateSdkGenOptions>


const { Jostraca } = JostracaModule


function CreateSdkGen(opts: CreateSdkGenOptions) {
  const fs = opts.fs || Fs
  const folder = opts.folder || '.'
  const jostraca = Jostraca()


  async function generate(spec: any) {
    console.log('CreateSdkGen.generate', spec)

    const { model, root } = spec

    const ctx$ = { fs, folder, meta: { spec } }

    try {
      await jostraca.generate(ctx$, () => root({ model }))
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
        generate(spec)
      }
    })

    spec.watch
      .map((wf: string) => (__dirname + '/' + wf))
      .map((wf: string) => (console.log(wf), wf))
      .map((wf: string) => fsw.add(wf))

    // generate()
  }


  return {
    generate,
    watch,
  }

}




export type {
  CreateSdkGenOptions,
}



export {
  CreateSdkGen,
}

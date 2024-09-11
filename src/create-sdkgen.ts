/* Copyright (c) 2024 Richard Rodger, MIT License */

import * as Fs from 'node:fs'


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
      jostraca.generate(ctx$, () => root({ model }))
    }
    catch (err: any) {
      console.log('CREATE SDKGEN ERROR: ', err)
      throw err
    }
  }


  return {
    generate,
  }

}




export type {
  CreateSdkGenOptions,
}



export {
  CreateSdkGen,
}

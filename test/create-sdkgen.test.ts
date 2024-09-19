
import { test, describe } from 'node:test'
import { expect } from '@hapi/code'

import { Aontu } from 'aontu'
import { memfs } from 'memfs'


import { cmp, each, Project, Folder, File, Content } from 'jostraca'


import {
  CreateSdkGen
} from '../'



describe('create-sdkgen', () => {

  test('happy', async () => {
    expect(CreateSdkGen).exist()
    /*
        const { fs, vol } = memfs({})
        const createsdkgen = CreateSdkGen({
          fs, folder: '/top'
        })
        expect(createsdkgen).exist()
    
        const root = makeRoot()
        const model = makeModel()
        // console.log('MODEL', model)
    
        const spec = {
          model,
          root
        }
    
        await createsdkgen.generate(spec)
    
        expect(vol.toJSON()).equal({
        })
        */
  })


  function makeModel() {
    return Aontu(`
a:1
`).gen()
  }


  function makeRoot() {
    return cmp(function Root(props: any) {
      const { model } = props
      Project({ model }, () => {
        /*
        each(model.main.sdk, (sdk: any) => {
          Folder({ name: sdk.name }, () => {
            File({ name: 'README.md' }, () => {
              Code(`
# ${model.name} ${sdk.name} SDK
  `)
            })
          })
          })
          */
      })
    })
  }
})


#!/usr/bin/env node

const { CreateSdkGen } = require('../dist/create-sdkgen.js') 

const { Root } = require('../dist/standard/Root')


const folder = process.argv[2]
const name = process.argv[3]


console.log('CreateSdkGen', CreateSdkGen, folder)

const createSdkGen = CreateSdkGen({folder})

const model = {
  name,
}


/*
createSdkGen.generate({
  model,
  root: Root,
})
*/


createSdkGen.watch({
  model,
  root: Root,
  watch: [
    '../tm',
    '../dist',
  ],
})

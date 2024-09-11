#!/usr/bin/env node

const { CreateSdkGen } = require('../dist/create-sdkgen.js') 

const { Root } = require('../dist/standard/Root')


const folder = process.argv[2]

console.log('CreateSdkGen', CreateSdkGen, folder)

const createSdkGen = CreateSdkGen({folder})

createSdkGen.generate({
  model: {name:'foo'},
  root: Root,
})

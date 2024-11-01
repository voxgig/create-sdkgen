#!/usr/bin/env node

const Path = require('node:path')
const { statSync } = require('node:fs')
const { parseArgs } = require('node:util')

const { Gubu, Fault } = require('gubu')
const { Aontu, Context } = require('aontu')


const Pkg = require('../package.json')

const { CreateSdkGen } = require('../dist/create-sdkgen.js') 

// const { Root } = require('../dist/standard/Root')
const rootpath = require.resolve('../dist/standard/Root')

let DEBUG = false
let CONSOLE = console


try {
  let options = resolveOptions()

  if(options.debug) {
    DEBUG = true
  }

  if(options.version) {
    version()
  }

  if(options.help) {
    help()
  }

  if(options.version || options.help) {
    exit()
  }

  options = validateOptions(options)

  generate(options)
  
}
catch(err) {
  handleError(err)
}



function exit(err) {
  let code = 0
  if(err) {
    code = 1
  }
  process.exit(code)
}


function generate(options) {
  const createSdkGen = CreateSdkGen({
    folder: options.folder,
    rootpath
  })


  const model = resolveModel(options)
    
  const spec = {
    // TODO: move to CreateSdkGen options
    spec: options.spec,
    model,
    // root: Root,
  }
  
  if(options.watch) {
    spec.watch = [
      '../tm',
      '../feature',
      '../def',
      '../dist',
    ]
    createSdkGen.watch(spec)
  }
  else {
    createSdkGen.generate(spec)
  }

}


function resolveModel(options) {

  const typespec = `
name: string
year: number
def: filepath: string
feature: &: {
  active: *false | boolean
}
`

  const features = options.feature.map(name=>`feature:${name}:active:true`)
  
  const src = [
    typespec,
    `name: ${options.name}`,
    `year: ${new Date().getFullYear()}`,
    `def: filepath: "${options.def || 'def.yml'}"`,
    '' === options.model ? '' : `@"${options.model}"`,
    ...(options.set||[]),
    ...(features||[]),
  ].join('\n')
  const aopts = {}
  const root = Aontu(src, aopts)
  const hasErr = root.err && 0 < root.err.length

  // TODO: collect all errors
  if (hasErr) {
    // console.log('ERROR ROOT', root.err)
    throw root.err[0].msg
  }

  let genctx = new Context({ root })
  const model = root.gen(genctx)

  // TODO: collect all errors
  if (genctx.err && 0 < genctx.err.length) {
    // console.log(genctx.err)
    // console.log('ERROR GEN', genctx.err)
    throw new Error(JSON.stringify(genctx.err[0]))
  }
  
  model.def.filename = Path.basename(model.def.filepath)

  // console.log('MODEL')
  // console.dir(model,{depth:null})
  
  return model
}


function resolveOptions() {

  const args = parseArgs({
    allowPositionals: true,
    options: {
      folder: {
        type: 'string',
        short: 'f',
        default: '',
      },
      
      def: {
        type: 'string',
        short: 'd',
        default: '',
      },
      
      set: {
        type: 'string',
        short: 's',
        multiple: true,
      },

      model: {
        type: 'string',
        short: 'm',
        default: '',
      },
      
      feature: {
        type: 'string',
        short: 't',
        multiple: true,
      },
      
      watch: {
        type: 'boolean',
        short: 'w',
      },
      
      debug: {
        type: 'boolean',
        short: 'g',
      },
      
      help: {
        type: 'boolean',
        short: 'h',
      },
      
      version: {
        type: 'boolean',
        short: 'v',
      },
      
    }
  })

  const options = {
    name: args.positionals[0],
    folder: '' === args.values.folder ? args.positionals[0] : args.values.folder,
    def: args.values.def,
    model: args.values.model,
    feature: args.values.feature,
    set: args.values.set,
    watch: !!args.values.watch,
    debug: !!args.values.debug,
    help: !!args.values.help,
    version: !!args.values.version,
  }

  return options
}


function validateOptions(rawOptions) {
  const optShape = Gubu({
    name: Fault('The first argument should be the project name.', String),
    folder: String,
    def: '',
    model: '',
    feature: [String],
    set: [String],
    watch: Boolean,
    debug: Boolean,
    help: Boolean,
    version: Boolean,
  })

  const err = []
  const options = optShape(rawOptions,{err})

  if(err[0]) {
    throw new Error(err[0].text)
  }

  if('' !== options.def) {
    options.def = Path.resolve(options.def)
    const stat = statSync(options.def, {throwIfNoEntry:false})
    if(null == stat) {
      throw new Error('Definition file not found: '+options.def)
    }
  }

  if('' !== options.model) {
    options.model = Path.resolve(options.model)
    const stat = statSync(options.model, {throwIfNoEntry:false})
    if(null == stat) {
      throw new Error('Model file not found: '+options.model)
    }
  }

  return options
}


function handleError(err) {
  CONSOLE.log('Voxgig SDK Generator Error:')

  if(DEBUG) {
    CONSOLE.log(err)
  }
  else {
    CONSOLE.log(err.message)
  }
  
  exit(err)
}


function version() {
  CONSOLE.log(Pkg.version)
}


function help() {
  let s = `
Create a Voxgig SDK Generator project.

Usage: npm create @voxgig/sdkgen@latest <name> <args> 

  where <name> is the name of the SDK project. This is also used to
    create a project folder if one is not explictly defined using the -f
    argument. If run against an existing folder generated files will be
    overwritten.

  <args> are the command arguments:

    --folder <folder>      Specific the folder for the SDK project. Optional.
    -f <folder>              Default: <name> in current folder.

    --def <file>           Specify the API definition file (OpenAPI, Swagger, etc)
    -d                       that defines the SDK. Optional.

    --model <file>         Specify the SDK model file to customize the SDK. Optional.
    -m
    
    --feature <name>       Specify a feature to include in the SDK. Can be specified multiple times.
    -t <name>

    --watch                Run in watch mode. The SDK project will be updated if any of the
    -w                       project inputs (such as the spec file) change.

    --debug                Print verbose logging.
    -g                    

    --help                 Print this help message.
    -h

    --version              Print version number.
    -v


Examples:

# Basic usage
> npm create @voxgig/sdkgen@latest foo
# Creates the SDK Project in the folder ./foo


# Custom project folder
> npm create @voxgig/sdkgen@latest foo -f ~/Projects/Foo
# Creates the SDK Project in the folder ~/Projects/Foo


See also: https://voxgig.com/sdkgen
`

  CONSOLE.log(s)
}

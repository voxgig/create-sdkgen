
const { SdkGen } = require('@voxgig/sdkgen')

const config = {
  root: __dirname+'/../dist/Root.js',
  folder: __dirname+'/../..',
  meta: {
    name: '$$name$$'
  },
  model: {
    folder: __dirname+'/../model',
  },
}

module.exports = SdkGen.makeBuild(config)

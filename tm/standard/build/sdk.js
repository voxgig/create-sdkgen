
const { SdkGen } = require('@voxgig/sdkgen')

try {
  const config = {
    root: __dirname+'/../dist/Root.js',
    folder: __dirname+'/../sdk',
    def: __dirname+'/../def/$$def.filename$$',
    meta: {
      name: '$$name$$'
    },
    model: {
      folder: __dirname+'/../model',
    },
  }

  module.exports = SdkGen.makeBuild(config)

}
catch(e) {
  console.log('SDK ERROR', e)
}

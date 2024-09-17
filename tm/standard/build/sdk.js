
const { SdkGen } = require('@voxgig/sdkgen')
const { Root } = require('../dist/Root')


try {
  const config = {
    folder: __dirname+'/../sdk',
    def: __dirname+'/../def/$$def.filename$$',
    meta: {
      name: '$$name$$'
    },
    model: {
      folder: __dirname+'/../model',
      
      entity: {}
    },
  }

  module.exports = SdkGen.makeBuild(Root, config)

}
catch(e) {
  console.log('SDK ERROR', e)
}

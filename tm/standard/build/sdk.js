
const { SdkGen } = require('@voxgig/sdkgen')
const { Root } = require('../dist/Root')


try {
  const config = {
    folder: __dirname+'/../sdk',
    def: __dirname+'/../def/$DefinitionFile',
    meta: {
      name: '$ProjectName'
    },
    model: {
    folder: __dirname+'/../model',
      
      entity: $EntityModel
    },
  }

  module.exports = SdkGen.makeBuild(Root, config)

}
catch(e) {
  console.log('SDK ERROR', e)
}

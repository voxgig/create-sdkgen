
const { SdkGen } = require('@voxgig/sdkgen')
const { Root } = require('../dist/Root')


module.exports = SdkGen.makeBuild(Root, {
  folder: __dirname+'/../sdk',
  def: __dirname+'/../def/$DefinitionFile',
  meta: {
    name: '$ProjectName'
  },
  model: {
    folder: __dirname+'/../model',

    entity: $EntityModel
  },
})


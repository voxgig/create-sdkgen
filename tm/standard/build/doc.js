
const { DocGen } = require('@voxgig/docgen')

try {
  const config = {
    root: __dirname+'/../dist/WebRoot.js',
    folder: __dirname+'/../doc',
    def: __dirname+'/../def/$$def.filename$$',
    meta: {
      name: '$$name$$'
    },
    model: {
      folder: __dirname+'/../model',
    },
  }

  // console.log('DOC BUILD', config)
  
  module.exports = DocGen.makeBuild(config)
}
catch(e) {
  console.log('DOC ERROR', e)
}

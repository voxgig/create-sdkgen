

import Path from 'node:path'


import {
  names,
  cmp,
  each,

  Project,
  Folder,
  Copy,
  File,
  Content,

} from 'jostraca'



const Root = cmp(function Root(props: any) {
  const { model, ctx$ } = props

  const { folder, meta } = ctx$
  const { spec } = meta

  console.log('Root 5')

  // console.log('SPEC', spec)

  names(model, model.name)

  // console.log('MODEL')
  // console.dir(model, { depth: null })

  ctx$.model = model

  let createInfo = { exclude: [], last: Number.MAX_SAFE_INTEGER }

  try {
    createInfo = JSON.parse(ctx$.fs.readFileSync(
      Path.join(folder, '.voxgig', 'create-sdkgen.json'), 'utf8'))
  }
  catch (err: any) {
    console.log(err)
    // TODO: file not foound ignored, handle others!
  }

  ctx$.info = createInfo

  console.log('INFO', ctx$.info)

  Project({ folder }, () => {

    // TODO: perhaps remove the need for this, create top level folder in Project
    // would keep paths indo of project folder name
    Folder({ name: Path.basename(folder) }, () => {

      File({ name: 'foo.txt' }, () => {
        Content('FOO')
      })

      // console.log('FOLDER', folder)
      Copy({ from: __dirname + '/../../tm/standard', name: folder })

      const def = model.def.filepath
      if (null != def && '' !== def) {
        Folder({ name: 'def' }, () => {
          Copy({ from: def, name: Path.basename(def) })
        })
      }

      Folder({ name: '.voxgig' }, () => {
        /*
        File({ name: 'create-sdkgen.json', exclude: false }, () => {
          const exclude = ctx$.info.exclude
          const info = {
            last: Date.now(),
            exclude,
          }
          console.log('INFO', info)
          Content(JSON.stringify(info, null, 2))
          })
          */
      })
    })
  })

  // TODO: need mechanism to ensure this is last
  setTimeout(() => {
    try {
      const info = {
        last: Date.now(),
        exclude: ctx$.info.exclude,
      }
      ctx$.fs.writeFileSync(Path.join(folder, '.voxgig', 'create-sdkgen.json'),
        JSON.stringify(info, null, 2))
    }
    catch (err: any) {
      console.log(err)
      // TODO: file not foound ignored, handle others!
    }
  }, 777)
})


export {
  Root
}

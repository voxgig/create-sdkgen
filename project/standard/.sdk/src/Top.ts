

import {
  cmp, each, Line, File, Content
} from '@voxgig/sdkgen'


const Top = cmp(function Top(props: any) {
  const { ctx$ } = props
  const { model } = ctx$

  File({ name: 'README.md' }, () => {
    Content(`# ${model.Name} SDKs

## API Entities

\`\`\`mermaid 
flowchart LR
`)

    const entityMap = model.main.api.entity

    each(entityMap, (entity: any) => {
      const ancestors = entity.ancestors || []
      if (0 < ancestors.length) {
        const pname = ancestors[ancestors.length - 1]
        const parent = entityMap[pname]
        if (null != parent) {
          Line(`  ${parent.Name} --> ${entity.Name}`)
        }
      }
    })

    Content(`
\`\`\`

`)



  })
})


export {
  Top
}


import { cmp, File, Content, Folder } from '@voxgig/sdkgen'


import { Quick } from './Quick_py'
import { TestMain } from './TestMain_py'
import { TestAccept } from './TestAccept_py'


const Test = cmp(function Test_(props: any) {
  const { build } = props

  Folder({ name: 'tests' }, () => {

    Quick({ build })
    TestMain({ build })

    Folder({ name: 'accept' }, () => {
      TestAccept({ build })
    })

  })

})


export {
  Test
}

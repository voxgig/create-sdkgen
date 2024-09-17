
import { cmp, File, Content, Folder } from '@voxgig/sdkgen'

import { Quick } from './Quick_js'
import { TestMain } from './TestMain_js'
import { TestAccept } from './TestAccept_js'


const Test = cmp(function Test(props: any) {
  const { build } = props

  Folder({ name: 'test' }, () => {
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

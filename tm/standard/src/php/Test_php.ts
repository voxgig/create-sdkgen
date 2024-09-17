
import { cmp, File, Content, Folder } from '@voxgig/sdkgen'

import { Quick } from './Quick_php'
import { TestMain } from './TestMain_php'


const Test = cmp(function Test(props: any) {
  const { build } = props

  Folder({ name: 'test' }, () => {

    Quick({ build })
    TestMain({ build })
  })
})


export {
  Test
}

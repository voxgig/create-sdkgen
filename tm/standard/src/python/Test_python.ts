import { cmp, File, Code, Folder } from '@voxgig/sdkgen'

import { Quick } from './Quick_python'
import { TestMain } from './TestMain_python'


const Test = cmp(function Test_python(props: any) {
  const { build } = props

  Folder({ name: 'tests' }, () => {

    Quick({ build })
    TestMain({ build })
  })

})


export {
  Test
}

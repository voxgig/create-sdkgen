
import { cmp } from '@voxgig/sdkgen'

import { Quick } from './Quick_go'
import { TestMain } from './TestMain_go'
import { TestAccept } from './TestAccept_go'


const Test = cmp(function Test_go(props: any) {
  const { build } = props


  Quick({ build })
  TestMain({ build })
  TestAccept({ build })
})


export {
  Test
}

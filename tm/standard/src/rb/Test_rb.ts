
import { cmp, File, Folder, Copy, Content } from '@voxgig/sdkgen'

import { Quick } from './Quick_rb'
import { TestMain } from './TestMain_rb'
import { TestAccept } from './TestAccept_rb'


const Test = cmp(function Test(props: any) {
  const { build, model } = props

  Copy({ from: "tm/" + build.name + "/.rspec", name: ".rspec" });

  Folder({ name: 'spec' }, () => {
    Copy({ from: "tm/" + build.name + "/spec/spec_helper.rb", name: "spec_helper.rb" });
    Quick({ build })
    TestMain({ build })
    Folder({ name: 'integration' }, () => {
      TestAccept({ build })
    })
  })
})


export {
  Test
}

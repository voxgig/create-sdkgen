
import { cmp, File, Code, Folder, Copy } from '@voxgig/sdkgen'

import { Quick } from './Quick_ruby'
import { TestMain } from './TestMain_ruby'
import { TestAccept } from './TestAccept_ruby'


const Test = cmp(function Test_ruby(props: any) {
  const { build } = props

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

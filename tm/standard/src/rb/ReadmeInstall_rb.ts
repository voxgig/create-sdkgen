
import { cmp, Content } from '@voxgig/sdkgen'


const ReadmeInstall = cmp(function ReadmeInstall(props: any) {
  const { build } = props

  Content('```ruby')
  Content(`
gem install ${build.module.name}
`)
  Content('```')

})


export {
  ReadmeInstall
}

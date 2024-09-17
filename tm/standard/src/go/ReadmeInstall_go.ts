
import { cmp, Content } from '@voxgig/sdkgen'


const ReadmeInstall = cmp(function ReadmeInstall(props: any) {
  const { build } = props

  Content('```go')
  Content(`
go get ${build.module.name}
`)
  Content('```')

})


export {
  ReadmeInstall
}

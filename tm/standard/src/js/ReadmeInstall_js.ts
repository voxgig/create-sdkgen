
import { cmp, Code } from '@voxgig/sdkgen'


const ReadmeInstall = cmp(function ReadmeInstall(props: any) {
  const { build } = props

  Code('```js')
  Code(`
npm install ${build.module.name}
`)
  Code('```')

})


export {
  ReadmeInstall
}

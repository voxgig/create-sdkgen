
import { cmp, File, Code, Folder } from '@voxgig/sdkgen'


const Entity_js = cmp(function Entity_js(props: any) {
  const { build, entity } = props
  const { model } = props.ctx$


  Folder({ name: 'src' }, () => {

    File({ name: entity.Name + '.' + build.name }, () => {

      Code(`
// ${model.Name} ${build.Name} ${entity.Name}

class ${entity.Name} {
  def
  data


  constructor(sdk,data) {
    this.sdk = ()=>sdk
    this.def = {
      name: '${entity.name}'
    }
    // data is optional
    this.data = data
  }


  async handleResult(op, res, spec, handler) {
    const status = res.status

    if(200 === status) {
      const json = await res.json()
      // TODO: error
      return handler(json)
    }
    else {
      throw new Error('HTTP-ERROR: '+op+': ${entity.name}: '+status)
    }
  }


  async save(data) {
    const op = 'save'
    this.data = data
    // TODO: validate data

    const spec = this.sdk().fetchSpec(op,this)
    const res = await this.sdk().options.fetch(spec.url,spec)

    return this.handleResult(op, res, spec, (json)=>{
      this.data = json
      return this
    })
  }


  async load(data) {
    const op = 'load'
    this.data = data
    // TODO: check data.id defined
    // TODO: separate data and query

    const spec = this.sdk().fetchSpec(op,this)
    const res = await this.sdk().options.fetch(spec.url,spec)

   return this.handleResult(op, res, spec, (json)=>{
      this.data = json
      return this
    })
  }


  async remove(data) {
    const op = 'remove'
    this.data = data
    // TODO: check data.id defined

    const spec = this.sdk().fetchSpec(op,this)
    const res = await this.sdk().options.fetch(spec.url,spec)

    return this.handleResult(op, res, spec, (json)=>{
      this.data = json
      return null
    })
  }


  async list(query) {
    const op = 'list'
    // TODO: use query if defined

    const spec = this.sdk().fetchSpec(op,this)
    const res = await this.sdk().options.fetch(spec.url,spec)

    return this.handleResult(op, res, spec, (json)=>{
      return json.list.map(data=>this.sdk().${entity.Name}(data))
    })
  }

}


module.exports = {
  ${entity.Name}
}

`)
    })
  })
})


export {
  Entity_js
}


// Entity 1

import { cmp, each, File, Content, Folder } from '@voxgig/sdkgen'


const Entity = cmp(function Entity(props: any) {
  const { build, entity } = props
  const { model } = props.ctx$


  Folder({ name: 'src' }, () => {

    File({ name: entity.Name + '.' + build.name }, () => {

      const modifyRequest = each(model.main.sdk.feature).map((feature: any) => {
        return `
spec = this.sdk().features.${feature.name}.modifyRequest(spec, ctx)
`
      })

      const modifyResponse = each(model.main.sdk.feature).map((feature: any) => {
        return `
      out = this.sdk().features.${feature.name}.modifyResponse(spec, ctx, out)
`
      })

      Content(`
// ${model.Name} ${build.Name} ${entity.Name} 1

class ${entity.Name} {
  def
  sdk
  data


  constructor(sdk,data) {
    this.sdk = ()=>sdk
    this.def = {
      name: '${entity.name}'
    }
    // data is optional
    this.data = data
  }


  async handleResult(ctx, res, spec, handler) {
    const status = res.status

    if(200 === status) {
      let out = await res.json()
      // TODO: error

      ${modifyResponse}
      return handler(out)
    }
    else {
      throw new Error('HTTP-ERROR: '+ctx.op+': ${entity.name}: '+status)
    }
  }
`)

      Content(`
  async save(data) {
    const ctx = {op:'save'}
    this.data = data
    // TODO: validate data

    let spec = this.sdk().fetchSpec(ctx,this)
    ${modifyRequest}
    const res = await this.sdk().options.fetch(spec.url,spec)

    return this.handleResult(ctx, res, spec, (json)=>{
      this.data = json
      return this
    })
  }

`)

      Content(`
  async create(data) {
    const ctx = {op:'create'}
    this.data = data
    // TODO: validate data

    let spec = this.sdk().fetchSpec(ctx,this)
    ${modifyRequest}
    const res = await this.sdk().options.fetch(spec.url,spec) 

    return this.handleResult(ctx, res, spec, (json)=>{
      this.data = json
      return this
    })
  }


`)

      Content(`
  async load(data) {
    const ctx = {op:'load'}
    this.data = data
    // TODO: check data.id defined
    // TODO: separate data and query

    let spec = this.sdk().fetchSpec(ctx,this)
    ${modifyRequest}
    const res = await this.sdk().options.fetch(spec.url,spec)

   return this.handleResult(ctx, res, spec, (json)=>{
      this.data = json
      return this
    })
  }


`)

      Content(`
  async remove(data) {
    const ctx = {op:'remove'}
    this.data = data
    // TODO: check data.id defined

    let spec = this.sdk().fetchSpec(ctx,this)
    ${modifyRequest}
    const res = await this.sdk().options.fetch(spec.url,spec)

    return this.handleResult(ctx, res, spec, (json)=>{
      this.data = json
      return null
    })
  }

`)

      Content(`
  async list(query) {
    const ctx = {op:'list'}
    // TODO: use query if defined

    let spec = this.sdk().fetchSpec(ctx,this)
    ${modifyRequest}
    const res = await this.sdk().options.fetch(spec.url,spec)

    return this.handleResult(ctx, res, spec, (json)=>{
      return json.list.map(data=>this.sdk().${entity.Name}(data))
    })
  }

`)

      Content(`

}


module.exports = {
  ${entity.Name}
}

`)
    })
  })
})


export {
  Entity
}

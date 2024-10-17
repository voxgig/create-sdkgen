
// Entity 1

import { cmp, each, File, Content, Folder } from '@voxgig/sdkgen'


const Entity = cmp(function Entity(props: any) {
  const { build, entity } = props
  const { model } = props.ctx$


  Folder({ name: 'src' }, () => {

    File({ name: entity.Name + '.' + build.name }, () => {

      const modifyRequest = each(model.main.sdk.feature).map((feature: any) => {
        if (feature.config.return == "promise") {
          return `
    spec = await this.sdk().features.${feature.name}.modifyRequest(ctx)
    `
        }
        if (feature.name == 'ratelimiter') {
          return `
    await this.sdk().features.${feature.name}.tryAcquire()`

        }
        return `
    spec = this.sdk().features.${feature.name}.modifyRequest(ctx)
`
      }).join('')

      const modifyResult = each(model.main.sdk.feature).map((feature: any) => {
        if (feature.name == 'ratelimiter') {
          return ''
        }
        return `
      ctx.result = this.sdk().features.${feature.name}.modifyResult(ctx)
`
      }).join('')

      Content(`
// ${model.Name} ${build.Name} ${entity.Name} 1

class ${entity.Name} {
  def
  sdk
  data
  query

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
      ctx.result = await res.json()
      // TODO: error

      ${modifyResult}
      return handler(ctx.result)
    }
    else {
      throw new Error('HTTP-ERROR: '+ctx.op+': ${entity.name}: '+status)
    }
  }
`)

      Content(`
  async save(data) {
    const ctx = {op:'save',entity:this}
    this.data = data
    this.query = {}
    // TODO: validate data

    let spec = ctx.spec = this.sdk().fetchSpec(ctx,this)
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
    const ctx = {op:'create',entity:this}
    this.data = data
    this.query = {}
    // TODO: validate data

    let spec = ctx.spec = this.sdk().fetchSpec(ctx,this)
    ${modifyRequest}

    if(this.sdk().options.debug) {
      console.log('FETCH-create', spec)
    }

    const res = await this.sdk().options.fetch(spec.url,spec) 

    return this.handleResult(ctx, res, spec, (json)=>{
      this.data = json
      return this
    })
  }


`)

      Content(`
  async load(query) {
    const ctx = {op:'load',entity:this}
    this.data = {}
    this.query = query || {}

    let spec = ctx.spec = this.sdk().fetchSpec(ctx,this)
    ${modifyRequest}

    if(this.sdk().options.debug) {
      console.log('FETCH-load', spec)
    }

    const res = await this.sdk().options.fetch(spec.url,spec)

    return this.handleResult(ctx, res, spec, (json)=>{
      this.data = json
      return this
    })
  }


`)

      Content(`
  async remove(query) {
    const ctx = {op:'remove',entity:this}
    this.data = {}
    this.query = query || {}

    let spec = ctx.spec = this.sdk().fetchSpec(ctx,this)
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
    const ctx = {op:'list',entity:this}
    this.data = {}
    this.query = query || {}

    let spec = ctx.spec = this.sdk().fetchSpec(ctx,this)
    ${modifyRequest}

    if(this.sdk().options.debug) {
      console.log('FETCH-load', spec)
    }

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

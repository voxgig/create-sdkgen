
class PageFeature {
  sdk
  config
  
  // Create a new instance for each client instance
  constructor(sdk, config) {
    this.sdk = sdk
    this.config = config
  }


  // If defined, pass in request spec
  // ctx contains context = { start: <time> }
  modifyRequest(spec, ctx) {
    if(ctx.page) {
      Object.assign(fetch.query, this.config.page.query||{})
    }
    return spec
  }

  
  // If defined, pass in request spec and response
  // ctx contains context = { start: <time>, end: <time>, res: <response> }
  modifyResponse(spec, ctx, out) {
    return out
  }

}



module.exports = {
  PageFeature
}

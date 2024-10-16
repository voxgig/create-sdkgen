
class PageFeature {
  sdk
  
  // Create a new instance for each client instance
  constructor(sdk) {
    this.sdk = sdk
  }


  // If defined, pass in request spec
  // ctx contains context = { start: <time> }
  modifyRequest(spec, ctx) {
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

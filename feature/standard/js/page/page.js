
class PageFeature {

  
  // Create a new instance for each client instance
  constructor() {

  }


  // If defined, pass in request spec
  // ctx contains context = { start: <time> }
  modifyRequest(spec, ctx) {
    return spec
  }

  // If defined, pass in request spec and response
  // ctx contains context = { start: <time>, end: <time>, res: <response> }
  modifyResponse(spec, out, ctx) {
    return spec
  }

  
}



module.exports = {
  PageFeature
}

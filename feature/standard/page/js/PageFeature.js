
class PageFeature {
  client
  config
  options
  
  // Create a new instance for each client instance
  constructor(client, config) {
    this.client = client
    this.config = config

    console.log('PAGE CONFIG', config)

    // Options for this feature appear under the `page` key
    this.options = client.options.page
  }


  // If defined, pass in request spec
  // ctx contains context = { start: <time> }
  modifyRequest(ctx) {
    const query = ctx.entity.query
    console.log('PAGE QUERY', query)
    
    if(query.page$) {
      const fetchQuery = {}
      Object.entries(query.page$).map(entry=>{
        let name = entry[0]
        let value = entry[1]
        let param = this.config.param[name]

        if(param && 'query'===param.kind) {
          console.log('PAGE QUERY ENTRY ***', name, value, param)

          // default via sdk options has precedence
          if(undefined === value && undefined !== param.defopt) {
            value = this.options[param.defopt]
          }
          if(undefined === value && undefined !== param.defval) {
            value = param.defval
          }
          
          fetchQuery[param.name] = value
        }
        // TODO: other param kinds
      })

      console.log('PAGE QUERY fetchQuery', fetchQuery)
      
      Object.assign(query, fetchQuery)
    }

    if(this.options.debug) {
      // TODO: need a well defined logger
      console.log('PAGE QUERY', query)
    }
    
    return ctx.spec
  }

  
  // If defined, pass in request spec and response
  // ctx contains context = { start: <time>, end: <time>, res: <response> }
  modifyResult(ctx) {
    return ctx.result
  }

}



module.exports = {
  PageFeature
}

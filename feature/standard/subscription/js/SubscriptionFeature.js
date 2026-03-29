class SubscriptionFeature {
    client
    config
    options
    
    constructor(client, config) {
      this.client = client
      this.config = config
  
      console.log('SUBSCRIPTION CONFIG', config)
  
      // Options for this feature appear under the `subscription` key
      this.options = client.options.subscription
    }
  
    modifyRequest(ctx) {
      const query = ctx.entity.query
      console.log('SUBSCRIPTION QUERY', query)
      
      if(query.subscription$) {
        const fetchQuery = {}
        Object.entries(query.subscription$).map(entry=>{
          let name = entry[0]
          let value = entry[1]
          let param = this.config.param[name]
  
          if(param && 'query'===param.kind) {
            console.log('SUBSCRIPTION QUERY ENTRY ***', name, value, param)
  
            if(undefined === value && undefined !== param.defopt) {
              value = this.options[param.defopt]
            }
            if(undefined === value && undefined !== param.defval) {
              value = param.defval
            }
            
            fetchQuery[param.name] = value
          }
        })
  
        console.log('SUBSCRIPTION QUERY fetchQuery', fetchQuery)
        
        Object.assign(query, fetchQuery)
      }
  
      if(this.options.debug) {
        console.log('SUBSCRIPTION QUERY', query)
      }
      
      return ctx.spec
    }
  
    modifyResult(ctx) {
      return ctx.result
    }
  }
  
  module.exports = {
    SubscriptionFeature
  }
  
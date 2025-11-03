class TopicFeature {
    client
    config
    options
    
    constructor(client, config) {
      this.client = client
      this.config = config
  
      console.log('TOPIC CONFIG', config)
  
      // Options for this feature appear under the `topic` key
      this.options = client.options.topic
    }
  
    modifyRequest(ctx) {
      const query = ctx.entity.query
      console.log('TOPIC QUERY', query)
      
      if(query.topic$) {
        const fetchQuery = {}
        Object.entries(query.topic$).map(entry=>{
          let name = entry[0]
          let value = entry[1]
          let param = this.config.param[name]
  
          if(param && 'query'===param.kind) {
            console.log('TOPIC QUERY ENTRY ***', name, value, param)
  
            // default via sdk options has precedence
            if(undefined === value && undefined !== param.defopt) {
              value = this.options[param.defopt]
            }
            if(undefined === value && undefined !== param.defval) {
              value = param.defval
            }
            
            fetchQuery[param.name] = value
          }
        })
  
        console.log('TOPIC QUERY fetchQuery', fetchQuery)
        
        Object.assign(query, fetchQuery)
      }
  
      if(this.options.debug) {
        console.log('TOPIC QUERY', query)
      }
      
      return ctx.spec
    }
  
    modifyResult(ctx) {
      return ctx.result
    }
  }
  
  module.exports = {
    TopicFeature
  }
  
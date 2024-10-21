const { Oauth2 } = require("./Oauth")

class OauthFeature {
  client
  config
  options

  // Create a new instance for each client instance
  constructor(client, config) {
    this.client = client
    this.config = config
    console.log('OAUTH CONFIG', config)

    this.options = client.options.oauth
    console.log('OAUTH OPTIONS', this.options)
  }

  // If defined, pass in request spec
  async modifyRequest(ctx) {
    const defaultTokenUri = process.env.OAUTH_TOKEN_URI
    const defaultHeaders = {
      accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    }

    const clientSpec = this.options.clientSpec || {
      uri: defaultTokenUri,
      headers: defaultHeaders,
    }

    const refreshSpec = this.options.refreshSpec || {
      uri: defaultTokenUri,
      headers: defaultHeaders,
    }


    const oAuthClient = new Oauth2({
      clientSpec: clientSpec,
      refreshSpec: refreshSpec
    })

    const token = await oAuthClient.getToken()

    ctx.spec.headers.authorization = "Bearer " + token
    return ctx.spec
  }


  // If defined, pass in request spec and response
  // ctx contains context = { start: <time>, end: <time>, res: <response> }
  modifyResult(ctx) {
    return ctx.result
  }

}



module.exports = {
  OauthFeature
}

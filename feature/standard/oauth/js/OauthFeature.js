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
    const configOptions = this.config.option

    const tokenUri = process.env[this.options.tokenUri
      || configOptions.tokenUri.defval]

    const clientId = process.env[this.options.clientId
      || configOptions.clientId.defval]

    const clientSecret = process.env[this.options.clientSecret
      || configOptions.clientSecret.defval]

    const credentialsKey = this.options.credentialsKey

    const oAuthClient = new Oauth2({
      clientSpec: {
        uri: tokenUri,
        headers: this.options.clientHeaders
          || {
          accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64')
        },
        params: this.options.clientParams,
        credentialsKey
      },
      refreshSpec: {
        uri: tokenUri,
        headers: this.options.refreshHeaders
          || {
          accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Client-Id': clientId,
        },
        params: this.options.refreshParams,
        credentialsKey
      }
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

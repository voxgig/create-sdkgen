const { URLSearchParams } = require('url')

class Oauth2 {
  #token = null
  #refreshToken = null
  #expiresIn = null

  constructor(option) {
    this.clientSpec = option.clientSpec
    this.refreshSpec = option.refreshSpec
  }

  async getToken() {
    if (!this.#isValidToken()) {
      if (!this.#refreshToken) {
        return this.#grantClientCredentials()
      }
      return this.#setRefreshToken()
    }

    return this.#token
  }

  async #grantClientCredentials() {
    const { headers, uri, params, credentialsKey } = this.clientSpec

    if (!headers || !uri) {
      throw new Error("OAuth2 Client " +
        "client must have uri and headers")
    }

    let encodedParams = new URLSearchParams();
    encodedParams.set('grant_type', 'client_credentials');
    encodedParams = this.#setParams(encodedParams, params)


    const resData = await this.#fetch({
      uri,
      headers,
      body: encodedParams
    })

    const credentialsData = resData[credentialsKey] || resData
    const token = credentialsData?.access_token

    if (!token) {
      console.info("Response properties returned: ", Object.keys(resData))
      throw new Error("OAuth2 Client " +
        "client credentials response doesn't have access_token property")
    }

    this.#saveCredentials(credentialsData)
    return token
  }

  async #setRefreshToken() {
    const { headers, uri, params, credentialsKey } = this.refreshSpec

    if (!headers || !uri) {
      throw new Error("OAuth2 Client " +
        "refresh must have uri and headers")
    }

    let encodedParams = new URLSearchParams();
    encodedParams.set('grant_type', 'refresh_token');
    encodedParams.set('refresh_token', this.#refreshToken);
    encodedParams = this.#setParams(encodedParams, params)


    const resData = await this.#fetch({
      uri,
      headers,
      body: encodedParams
    })

    const credentialsData = resData[credentialsKey] || resData
    const token = credentialsData?.access_token

    if (!token) {
      console.log("OAuth2 Client Refresh missing access_token ", credentialsData)
      this.#grantClientCredentials()
    }

    this.#saveCredentials(credentialsData)
    return token
  }

  #setExpiresIn(expTime) {
    const exp = +expTime
    const currTimeS = Math.floor(Date.now() / 1000)
    this.#expiresIn = currTimeS + exp
  }


  #isValidToken() {
    return this.#expiresIn >= Math.floor(Date.now() / 1000)
  }

  #setParams(initParams, addParams) {
    const setParams = initParams

    for (let param in addParams) {
      setParams.append(param, addParams[param])
    }

    return setParams
  }

  #saveCredentials(credentialsData) {
    this.#token = credentialsData?.access_token
    this.#refreshToken = credentialsData?.refresh_token
    this.#setExpiresIn(credentialsData?.expires_in)
  }

  async #fetch({ uri, headers, body }) {
    const options = {
      method: 'POST',
      headers,
      body
    };

    const res = await fetch(uri, options)
    return res.json()
  }
};

module.exports = {
  Oauth2
}

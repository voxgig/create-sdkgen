package oauth

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

type credentials struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
}

type oauthRes struct {
	Data credentials `json:"data"`
	credentials
}

type Spec struct {
	Headers map[string]string
	Params  map[string]string
	Uri     string
}

type oauth2 struct {
	expiresIn    int64
	clientSpec   Spec
	refreshSpec  Spec
	token        string
	refreshToken string
}

func (o *oauth2) getToken() (string, error) {
	if !o.isValidToken() {
		if o.refreshToken == "" {
			return o.grantClientCredentials()
		}
		return o.setRefreshToken()
	}

	return o.token, nil
}

func (o *oauth2) grantClientCredentials() (string, error) {
	if o.clientSpec.Uri == "" || o.clientSpec.Headers == nil {
		return "", fmt.Errorf("Error: OAuth2 Client " +
			"clientSpec must have uri and headers")
	}

	params := url.Values{}
	params.Set("grant_type", "client_credentials")
	params = o.setParams(params, o.clientSpec.Params)

	resBody, err := o.fetch(params, o.clientSpec.Uri, o.clientSpec.Headers)
	if err != nil {
		return "", err
	}

	var credentials oauthRes
	if err = json.Unmarshal(resBody, &credentials); err != nil {
		return "", fmt.Errorf("Error: OAuth2 clientSpec decoding success response: %v", err)
	}

	if credentials.AccessToken == "" && credentials.Data.AccessToken == "" {
		return "", fmt.Errorf("Error OAuth2 Client response doesn't have access_token property")
	}

	o.saveCredentials(&credentials)
	return o.token, nil
}

func (o *oauth2) setRefreshToken() (string, error) {
	if o.refreshSpec.Uri == "" || o.refreshSpec.Headers == nil {
		return "", fmt.Errorf("Error: OAuth2 Client refreshSpec must have uri and headers")
	}

	params := url.Values{}
	params.Set("grant_type", "refresh_token")
	params.Set("refresh_token", o.refreshToken)
	params = o.setParams(params, o.refreshSpec.Params)

	resBody, err := o.fetch(params, o.refreshSpec.Uri, o.refreshSpec.Headers)
	if err != nil {
		return "", fmt.Errorf("Error: OAuth2 refreshSpec make request: %v", err)
	}

	var credentials oauthRes
	if err = json.Unmarshal(resBody, &credentials); err != nil {
		return "", fmt.Errorf("Error: OAuth2 refreshSpec decoding success response: %v", err)
	}

	if credentials.AccessToken == "" && credentials.Data.AccessToken == "" {
		var resError map[string]any
		_ = json.Unmarshal(resBody, &resError)

		fmt.Printf("OAuth2 Client Refresh missing access_token %v", resError)
		return o.grantClientCredentials()
	}

	o.saveCredentials(&credentials)
	return o.token, nil
}

func (o *oauth2) setExpiresIn(exp int64) {
	currTimeS := time.Now().Unix()
	o.expiresIn = currTimeS + exp
}

func (o *oauth2) isValidToken() bool {
	currTimeS := time.Now().Unix()
	return o.expiresIn > currTimeS
}

func (o *oauth2) setParams(initParams url.Values, addParams map[string]string) url.Values {
	params := initParams

	for k, v := range addParams {
		params.Set(k, v)
	}

	return params
}

func (o *oauth2) setHeaders(req *http.Request, addHeaders map[string]string) *http.Request {
	for k, v := range addHeaders {
		req.Header.Set(k, v)
	}

	return req
}

func (o *oauth2) saveCredentials(credentials *oauthRes) {
	if credentials.Data.AccessToken != "" {
		o.token = credentials.Data.AccessToken
		o.refreshToken = credentials.Data.RefreshToken
		o.setExpiresIn(int64(credentials.Data.ExpiresIn))
		return
	}

	o.token = credentials.AccessToken
	o.refreshToken = credentials.RefreshToken
	o.setExpiresIn(int64(credentials.ExpiresIn))
}

func (o *oauth2) fetch(params url.Values, uri string, headers map[string]string) ([]byte, error) {
	newReq, err := http.NewRequest("POST", uri,
		bytes.NewBuffer([]byte(params.Encode())))
	if err != nil {
		return nil, fmt.Errorf("Error: OAuth2 new request: %v", err)
	}

	newReq = o.setHeaders(newReq, headers)

	client := &http.Client{}
	res, err := client.Do(newReq)
	if err != nil {
		return nil, fmt.Errorf("Error: OAuth2 make request: %v", err)
	}
	defer res.Body.Close()

	var resBody []byte
	resBody, err = io.ReadAll(res.Body)
	if err != nil {
		return nil, fmt.Errorf("Error: OAuth2 reading response: %v", err)
	}

	if res.StatusCode >= 400 {
		var resError map[string]any
		if err = json.Unmarshal(resBody, &resError); err != nil {
			return nil, err
		}

		return nil, fmt.Errorf("OAuth2 fail request: %v", resError)
	}

	return resBody, nil
}

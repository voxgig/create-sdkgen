package oauth

import (
	"os"

	"github.com/joho/godotenv"
)

type Options struct {
	ClientSpec  Spec
	RefreshSpec Spec
}

type OauthFeature struct {
	Options Options
}

func (o OauthFeature) modifyRequest(ctx map[string]any) (map[string]any, error) {
	godotenv.Load()

	defaultTokenUri, defaultHeaders := os.Getenv("OAUTH_TOKEN_URI"),
		map[string]string{
			"accept":       "application/json",
			"Content-Type": "application/x-www-form-urlencoded",
		}

	clientSpec := o.Options.ClientSpec
	if clientSpec.Uri == "" {
		clientSpec = Spec{
			Uri:     defaultTokenUri,
			Headers: defaultHeaders,
		}
	}

	refreshSpec := o.Options.RefreshSpec
	if refreshSpec.Uri == "" {
		refreshSpec = Spec{
			Uri:     defaultTokenUri,
			Headers: defaultHeaders,
		}
	}

	oauthClient := &oauth2{
		clientSpec:  clientSpec,
		refreshSpec: refreshSpec,
	}

	token, err := oauthClient.getToken()
	if err != nil {
		return nil, err
	}

	ctx["spec"] = token

	return ctx, nil
}

func (o OauthFeature) modifyResult(ctx map[string]any) (map[string]any, error) {
	return ctx, nil

}

func NewOauthFeature(options Options) *OauthFeature {
	return &OauthFeature{
		Options: options,
	}
}

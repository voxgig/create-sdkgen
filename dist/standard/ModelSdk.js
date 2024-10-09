"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelSdk = void 0;
const jostraca_1 = require("jostraca");
const ModelSdk = (0, jostraca_1.cmp)(function ModelSdk(props) {
    const { ctx$, ctx$: { model } } = props;
    // console.log('ModelSdk 2', model)
    // TODO: use apidef
    // const def = ctx$.fs.readFileSync(model.def.filepath)
    (0, jostraca_1.File)({ name: 'sdk.jsonic' }, () => {
        (0, jostraca_1.Content)(`

@"../node_modules/@voxgig/sdkgen/model/sdkgen.jsonic"

name: '${model.name}'

@"api.jsonic"
@"def.jsonic"

main: sdk: build: &: { name: .$KEY }

main: sdk: build: js: @"js.jsonic"

main: sdk: build: rb: @"rb.jsonic"

main: sdk: build: py: @"py.jsonic"

main: sdk: build: php: @"php.jsonic"

main: sdk: build: go: @"go.jsonic"



main: sdk: test: quick: entity: name: foo


main: sdk: entity: $.main.api.entity



main: sdk: option: {

  endpoint: {
    kind: *String | string
    short: "${model.Name} API URL"
  }

  apikey: {
    kind: *String | string
    short: "${model.Name} API Key"
  }
  
  fetch: {
    kind: *Any | string
    publish: false
  }
}
`);
        (0, jostraca_1.each)(model.feature).filter((feature) => feature.active).map((feature) => {
            (0, jostraca_1.Content)(`
main: sdk: feature: ${feature.name}: {
  active: true
  config: {
`);
            (0, jostraca_1.Fragment)({
                from: `${__dirname}/../../feature/standard/${feature.name}/${feature.name}-config.jsonic`,
                indent: '    '
            });
            (0, jostraca_1.Content)(`
  } 
}

`);
        });
    });
});
exports.ModelSdk = ModelSdk;
//# sourceMappingURL=ModelSdk.js.map
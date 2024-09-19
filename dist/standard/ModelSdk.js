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
name: '${model.name}'

@"api.jsonic"
@"def.jsonic"

main: sdk: build: &: { name: .$KEY }

main: sdk: build: js: @"js.jsonic"

main: sdk: build: rb: @"rb.jsonic"

main: sdk: build: py: @"py.jsonic"

main: sdk: build: php: @"php.jsonic"

main: sdk: build: go: @"go.jsonic"



main: sdk: test: quick: entity: name: q


main: sdk: entity: $.main.api.entity


main: sdk: entity: &: {
  name: .$KEY
  publish: *true | boolean
}



main: sdk: options: &: {
   name: .$KEY
   publish: *true | boolean
}


main: sdk: options: {

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
    });
});
exports.ModelSdk = ModelSdk;
//# sourceMappingURL=ModelSdk.js.map
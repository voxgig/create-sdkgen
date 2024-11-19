"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelSdk = void 0;
const jostraca_1 = require("jostraca");
const ModelSdk = (0, jostraca_1.cmp)(function ModelSdk(props) {
    const { spec } = props;
    (0, jostraca_1.File)({ name: 'sdk.jsonic' }, () => {
        (0, jostraca_1.Content)(`

@"../node_modules/@voxgig/sdkgen/model/sdkgen.jsonic"

name: '${spec.name}'
def: '${spec.def}'

@"api.jsonic"

main: sdk: entity: $.main.api.entity

main: sdk: option: $.main.api.entity

`);
    });
});
exports.ModelSdk = ModelSdk;
//# sourceMappingURL=ModelSdk.js.map
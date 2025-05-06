"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelSdk = void 0;
const jostraca_1 = require("jostraca");
const ModelSdk = (0, jostraca_1.cmp)(function ModelSdk(props) {
    const { spec } = props;
    (0, jostraca_1.File)({ name: 'sdk.jsonic' }, () => {
        (0, jostraca_1.Fragment)({
            from: __dirname + '/../../project/.sdk/model/sdk.fragment.jsonic',
            replace: {
                NAME: spec.name,
                DEF: spec.def,
            }
        });
    });
});
exports.ModelSdk = ModelSdk;
//# sourceMappingURL=ModelSdk.js.map
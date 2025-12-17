"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelSdk = void 0;
const node_path_1 = __importDefault(require("node:path"));
const jostraca_1 = require("jostraca");
const ModelSdk = (0, jostraca_1.cmp)(function ModelSdk(props) {
    const { spec } = props;
    const from = node_path_1.default.resolve(node_path_1.default.join(__dirname + '..', '..', '..', '..', 'project', 'standard'));
    (0, jostraca_1.File)({ name: 'sdk.jsonic' }, () => {
        (0, jostraca_1.Fragment)({
            from: node_path_1.default.join(from, spec.sdk_folder, 'model', 'sdk.fragment.jsonic'),
            replace: {
                ProjectName: spec.name,
                NAME: spec.name,
                DEF: spec.def,
            }
        });
    });
});
exports.ModelSdk = ModelSdk;
//# sourceMappingURL=ModelSdk.js.map
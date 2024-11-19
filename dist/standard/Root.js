"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Root = void 0;
const node_path_1 = __importDefault(require("node:path"));
const Fs = __importStar(require("node:fs"));
const jostraca_1 = require("jostraca");
const ModelSdk_1 = require("./ModelSdk");
// TODO: rename to RootSdk
const Root = (0, jostraca_1.cmp)(function Root(props) {
    const { ctx$, ctx$: { folder }, spec, model } = props;
    ctx$.model = model;
    (0, jostraca_1.Project)({ folder }, () => {
        (0, jostraca_1.Copy)({
            from: __dirname + '/../../tm/standard',
            exclude: ['generate/.env.local']
        });
        const origdef = spec.def;
        const projdef = node_path_1.default.basename(origdef);
        spec.def = projdef;
        (0, jostraca_1.Folder)({ name: 'generate' }, () => {
            (0, jostraca_1.Folder)({ name: 'def' }, () => {
                if (Fs.existsSync(origdef)) {
                    (0, jostraca_1.Copy)({ from: origdef, to: projdef });
                }
                else {
                    (0, jostraca_1.File)({ name: projdef }, () => {
                        (0, jostraca_1.Content)('# Insert OpenAPI Definition here');
                    });
                }
            });
            (0, jostraca_1.Folder)({ name: 'model' }, () => {
                (0, ModelSdk_1.ModelSdk)({ spec });
            });
        });
    });
});
exports.Root = Root;
//# sourceMappingURL=Root.js.map
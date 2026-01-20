"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRoot = void 0;
const node_path_1 = __importDefault(require("node:path"));
// import * as Fs from 'node:fs'
const jostraca_1 = require("jostraca");
const ModelSdk_1 = require("./ModelSdk");
// TODO: rename to RootSdk
const CreateRoot = (0, jostraca_1.cmp)(function CreateRoot(props) {
    const { ctx$, ctx$: { folder }, spec, model } = props;
    const fs = ctx$.fs();
    // TODO: move to @voxgig/util as duplicated
    model.const = { name: model.name };
    (0, jostraca_1.names)(model.const, model.name);
    model.const.year = new Date().getFullYear();
    ctx$.model = model;
    (0, jostraca_1.Project)({ folder }, () => {
        const from = node_path_1.default.resolve(node_path_1.default.join(__dirname + '..', '..', '..', '..', 'project', 'standard'));
        // console.log('FROM', from)
        (0, jostraca_1.Copy)({
            from,
            exclude: [/\.fragment\./]
        });
        const origdef = spec.def;
        const projdef = node_path_1.default.basename(origdef);
        spec.def = projdef;
        (0, jostraca_1.Folder)({ name: spec.sdk_folder }, () => {
            (0, jostraca_1.Folder)({ name: 'def' }, () => {
                // TODO: file existence check should be jostraca util
                if (fs.existsSync(origdef)) {
                    (0, jostraca_1.Copy)({ from: origdef, to: projdef });
                }
                else {
                    console.log('DEF NOT FOUND: ', origdef);
                    (0, jostraca_1.File)({ name: projdef }, () => {
                        (0, jostraca_1.Content)('# OpenAPI Definition');
                    });
                }
            });
            (0, jostraca_1.Folder)({ name: 'model' }, () => {
                (0, ModelSdk_1.ModelSdk)({ spec });
            });
        });
    });
});
exports.CreateRoot = CreateRoot;
//# sourceMappingURL=CreateRoot.js.map
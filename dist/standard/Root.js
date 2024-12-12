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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
    // TODO: move to @voxgig/util as duplicated
    model.const = { name: model.name };
    (0, jostraca_1.names)(model.const, model.name);
    model.const.year = new Date().getFullYear();
    ctx$.model = model;
    (0, jostraca_1.Project)({ folder }, () => {
        (0, jostraca_1.Copy)({
            from: __dirname + '/../../project',
            exclude: [
                'generate/.env.local',
                'generate/model/guide.jsonic',
                /\.fragment\./,
            ]
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
exports.Root = Root;
//# sourceMappingURL=Root.js.map
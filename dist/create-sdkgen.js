"use strict";
/* Copyright (c) 2024 Richard Rodger, MIT License */
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
exports.CreateSdkGen = CreateSdkGen;
const Fs = __importStar(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const util_1 = require("@voxgig/util");
const JostracaModule = __importStar(require("jostraca"));
const { each, names, Jostraca } = JostracaModule;
function CreateSdkGen(opts) {
    const fs = opts.fs || Fs;
    const pino = (0, util_1.prettyPino)('create', opts);
    const log = pino.child({ cmp: 'create' });
    const jostraca = Jostraca();
    async function generate(spec) {
        const start = Date.now();
        log.info({ point: 'generate-start', start });
        log.debug({ point: 'generate-spec', spec, note: JSON.stringify(spec, null, 2) });
        const rootModule = require(spec.root);
        const Root = rootModule.Root;
        const name = spec.name;
        spec.def = (null == spec.def || '' === spec.def) ? name + '-openapi3.yml' : spec.def;
        const folder = node_path_1.default.join(process.cwd(), name + (name.endsWith('-sdk') ? '' : '-sdk'));
        const opts = { fs, folder, log: log.child({ cmp: 'jostraca' }), meta: { spec } };
        const model = {
            name,
            year: new Date().getFullYear(),
        };
        names(model, model.name);
        log.debug({ point: 'generate-model', model, note: JSON.stringify(model, null, 2) });
        await jostraca.generate(opts, () => Root({ model, spec }));
        log.info({ point: 'generate-end' });
    }
    return {
        generate,
    };
}
//# sourceMappingURL=create-sdkgen.js.map
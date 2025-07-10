"use strict";
/* Copyright (c) 2024-2025 Richard Rodger, MIT License */
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
        const opts = {
            fs: () => fs,
            folder,
            log: log.child({ cmp: 'jostraca' }),
            meta: { spec },
            existing: {
                txt: {
                    merge: true
                }
            }
        };
        const model = {
            name,
            project_name: name,
            year: new Date().getFullYear(),
        };
        names(model, model.name);
        names(model, model.name, 'project_name');
        log.debug({ point: 'generate-model', model, note: JSON.stringify(model, null, 2) });
        const info = await jostraca.generate(opts, () => Root({ model, spec }));
        logfiles(info, log);
        log.info({ point: 'generate-end' });
    }
    return {
        generate,
    };
}
function logfiles(info, log) {
    const cwd = process.cwd();
    Object.keys(info.files).map(action => {
        let entries = info.files[action];
        if (0 < entries.length) {
            log.info({
                point: 'file-' + action, entries,
                note: '\n' + entries.map((n) => n.replace(cwd, '.')).join('\n')
            });
        }
    });
}
//# sourceMappingURL=create-sdkgen.js.map
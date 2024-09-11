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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSdkGen = CreateSdkGen;
const Fs = __importStar(require("node:fs"));
const JostracaModule = __importStar(require("jostraca"));
const { Jostraca } = JostracaModule;
function CreateSdkGen(opts) {
    const fs = opts.fs || Fs;
    const folder = opts.folder || '.';
    const jostraca = Jostraca();
    async function generate(spec) {
        console.log('CreateSdkGen.generate', spec);
        const { model, root } = spec;
        const ctx$ = { fs, folder, meta: { spec } };
        try {
            jostraca.generate(ctx$, () => root({ model }));
        }
        catch (err) {
            console.log('CREATE SDKGEN ERROR: ', err);
            throw err;
        }
    }
    return {
        generate,
    };
}
//# sourceMappingURL=create-sdkgen.js.map
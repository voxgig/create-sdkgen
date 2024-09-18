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
const chokidar_1 = require("chokidar");
const JostracaModule = __importStar(require("jostraca"));
const { Jostraca } = JostracaModule;
function CreateSdkGen(opts) {
    const fs = opts.fs || Fs;
    const folder = opts.folder || '.';
    const jostraca = Jostraca();
    const rootpath = opts.rootpath;
    async function generate(spec) {
        // console.log('CreateSdkGen.generate', spec)
        const { model } = spec;
        const ctx$ = { fs, folder, meta: { spec } };
        clear();
        const { Root } = require(rootpath);
        try {
            await jostraca.generate(ctx$, () => Root({ model }));
        }
        catch (err) {
            console.log('CREATE SDKGEN ERROR: ', err);
            throw err;
        }
    }
    async function watch(spec) {
        const fsw = new chokidar_1.FSWatcher();
        let last_change_time = 0;
        await generate(spec);
        fsw.on('change', (args) => {
            // console.log('CHANGE', args)
            const dorun = 1111 < Date.now() - last_change_time;
            if (dorun) {
                last_change_time = Date.now();
                generate(spec);
            }
        });
        spec.watch
            .map((wf) => (__dirname + '/' + wf))
            .map((wf) => (console.log(wf), wf))
            .map((wf) => fsw.add(wf));
        // generate()
    }
    function clear() {
        if (rootpath) {
            clearRequire(rootpath);
        }
    }
    return {
        generate,
        watch,
    };
}
// Adapted from https://github.com/sindresorhus/import-fresh - Thanks!
function clearRequire(path) {
    let filePath = require.resolve(path);
    if (require.cache[filePath]) {
        const children = require.cache[filePath].children.map(child => child.id);
        // Delete module from cache
        delete require.cache[filePath];
        for (const id of children) {
            clearRequire(id);
        }
    }
    if (require.cache[filePath] && require.cache[filePath].parent) {
        let i = require.cache[filePath].parent.children.length;
        while (i--) {
            if (require.cache[filePath].parent.children[i].id === filePath) {
                require.cache[filePath].parent.children.splice(i, 1);
            }
        }
    }
}
//# sourceMappingURL=create-sdkgen.js.map
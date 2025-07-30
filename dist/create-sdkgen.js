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
const child_process_1 = require("child_process");
const JostracaModule = __importStar(require("jostraca"));
const util_1 = require("@voxgig/util");
const package_json_1 = __importDefault(require("../package.json"));
const { names, Jostraca } = JostracaModule;
function CreateSdkGen(opts) {
    const fs = opts.fs || Fs;
    const pino = (0, util_1.prettyPino)('create', opts);
    const log = pino.child({ cmp: 'create' });
    const jostraca = Jostraca();
    async function generate(spec) {
        const start = Date.now();
        log.info({ point: 'generate-start', start, note: spec.project });
        log.debug({ point: 'generate-spec', spec, note: JSON.stringify(spec, null, 2) });
        const projectFolder = resolveProjectFolder(spec);
        const rootPath = node_path_1.default.join(projectFolder, spec.root);
        const rootModule = require(rootPath);
        const Root = rootModule.Root;
        const name = spec.name;
        spec.def = (null == spec.def || '' === spec.def) ? name + '-openapi3.yml' : spec.def;
        const folder = node_path_1.default.join(process.cwd(), name + (name.endsWith('-sdk') ? '' : '-sdk'));
        const jopts = {
            fs: () => fs,
            folder,
            log: log.child({ cmp: 'jostraca' }),
            meta: { spec },
            existing: {
                txt: {
                    merge: true
                }
            },
            control: {
                dryrun: spec.dryrun
            }
        };
        const model = {
            name,
            project_name: name,
            project_kind: spec.project,
            year: new Date().getFullYear(),
            create_version: package_json_1.default.version
        };
        names(model, model.name);
        names(model, model.name, 'project_name');
        log.debug({ point: 'generate-model', model, note: JSON.stringify(model, null, 2) });
        const jres = await jostraca.generate(jopts, () => Root({ model, spec }));
        // logfiles(jres, log)
        (0, util_1.showChanges)(jopts.log, 'generate-result', jres, node_path_1.default.dirname(process.cwd()));
        if (!spec.dryrun && spec.install) {
            await installNpm(spec, jopts, model);
        }
        log.info({ point: 'generate-end' });
    }
    function resolveProjectFolder(spec) {
        let projectFolder = spec.project;
        if (node_path_1.default.isAbsolute(projectFolder)) {
            return projectFolder;
        }
        projectFolder = node_path_1.default.resolve(node_path_1.default.join(__dirname, 'project', spec.project));
        // TODO: support auto install project npm package (specific version) in a special cache folder
        if (!fs.existsSync(projectFolder)) {
            projectFolder = spec.project;
        }
        return projectFolder;
    }
    return {
        generate,
    };
}
async function installNpm(spec, opts, model) {
    const folder = opts.folder;
    const log = opts.log;
    return new Promise((resolve, reject) => {
        const cwd = node_path_1.default.resolve(folder, '.sdk');
        log.info({ point: 'generate-install', install: 'npm', note: 'npm install # ' + cwd });
        const env = {
            ...process.env,
            PATH: `${node_path_1.default.dirname(process.execPath)}${node_path_1.default.delimiter}${process.env.PATH}`,
        };
        const args = ['install'];
        const spawn_opts = {
            cwd,
            env,
            stdio: 'inherit', // Direct passthrough for real-time output
        };
        const child = (0, child_process_1.spawn)('npm', args, spawn_opts);
        child.on('error', (err) => reject(new Error(`Failed to start npm: ${err.message}`)));
        child.on('close', async (code) => {
            if (code !== 0) {
                reject(new Error(`npm install exited with code ${code}`));
            }
            else {
                await installTargets(spec, opts, model, spawn_opts);
                await installFeatures(spec, opts, model, spawn_opts);
                resolve(null);
            }
        });
    });
}
async function installTargets(spec, opts, model, spawn_opts) {
    const target = spec.target;
    if (null == target || 0 === target.length) {
        return;
    }
    const log = opts.log;
    return new Promise((resolve, reject) => {
        const targetlist = target.join(',');
        log.info({
            point: 'generate-target', target: targetlist,
            note: 'npm run target-add ' + targetlist
        });
        const args = ['run', 'add-target', targetlist];
        const child = (0, child_process_1.spawn)('npm', args, spawn_opts);
        child.on('error', (err) => reject(new Error(`Failed to start npm: ${err.message}`)));
        child.on('close', async (code) => {
            if (code !== 0) {
                reject(new Error(`npm exited with code ${code}`));
            }
            else {
                resolve(null);
            }
        });
    });
}
async function installFeatures(spec, opts, model, spawn_opts) {
    const feature = spec.feature;
    if (null == feature || 0 === feature.length) {
        return;
    }
    const log = opts.log;
    return new Promise((resolve, reject) => {
        const featurelist = feature.join(',');
        log.info({
            point: 'generate-feature', feature: featurelist,
            note: 'npm run feature-add ' + featurelist
        });
        const args = ['run', 'add-feature', featurelist];
        const child = (0, child_process_1.spawn)('npm', args, spawn_opts);
        child.on('error', (err) => reject(new Error(`Failed to start npm: ${err.message}`)));
        child.on('close', async (code) => {
            if (code !== 0) {
                reject(new Error(`npm exited with code ${code}`));
            }
            else {
                resolve(null);
            }
        });
    });
}
//# sourceMappingURL=create-sdkgen.js.map
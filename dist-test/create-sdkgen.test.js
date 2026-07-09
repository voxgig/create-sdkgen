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
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const Fs = __importStar(require("node:fs"));
const Os = __importStar(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const __1 = require("../");
// All test artefacts live under one temp root, removed after the suite.
const TMP_ROOT = Fs.mkdtempSync(node_path_1.default.join(Os.tmpdir(), 'csdk-test-'));
const DEF_CONTENT = 'openapi: 3.0.0\ninfo:\n  title: Pet Store\n  version: 1.0.0\npaths: {}\n';
(0, node_test_1.after)(() => {
    Fs.rmSync(TMP_ROOT, { recursive: true, force: true });
});
function tmpdir(label) {
    return Fs.mkdtempSync(node_path_1.default.join(TMP_ROOT, label + '-'));
}
// Recursively list files (relative, posix-style) under a folder.
function walk(dir, prefix = '') {
    if (!Fs.existsSync(dir)) {
        return [];
    }
    return Fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory()
        ? walk(node_path_1.default.join(dir, e.name), prefix + e.name + '/')
        : [prefix + e.name]);
}
// Scaffold a project into a fresh temp folder with npm install disabled, and
// return helpers to inspect the generated output. `def === undefined` writes a
// real def file; pass an explicit string (including '') to control def handling.
async function scaffold(over = {}) {
    const work = tmpdir('gen');
    const out = node_path_1.default.join(work, 'out');
    const name = over.name ?? 'petstore';
    let def = over.def;
    if (undefined === def) {
        def = node_path_1.default.join(work, 'petstore.yml');
        Fs.writeFileSync(def, DEF_CONTENT);
    }
    const createSdkGen = (0, __1.CreateSdkGen)({ debug: 'warn' });
    await createSdkGen.generate({
        root: 'CreateRoot',
        name,
        def,
        project: 'standard',
        folder: out,
        install: false,
        dryrun: !!over.dryrun,
    });
    return {
        work,
        out,
        exists: (rel) => Fs.existsSync(node_path_1.default.join(out, rel)),
        read: (rel) => Fs.readFileSync(node_path_1.default.join(out, rel), 'utf8'),
        files: () => walk(out),
    };
}
(0, node_test_1.describe)('create-sdkgen', () => {
    (0, node_test_1.test)('happy', async () => {
        node_assert_1.default.equal(typeof __1.CreateSdkGen, 'function');
    });
    (0, node_test_1.test)('factory-returns-generate', async () => {
        const csg = (0, __1.CreateSdkGen)({ debug: 'warn' });
        node_assert_1.default.equal(typeof csg, 'object');
        node_assert_1.default.equal(typeof csg.generate, 'function');
    });
    (0, node_test_1.test)('scaffold-core-files', async () => {
        const s = await scaffold();
        // Top-level project files + the .sdk generator project skeleton.
        for (const rel of [
            '.gitignore',
            '.github/workflows/ci.yml',
            '.sdk/.gitignore',
            '.sdk/package.json',
            '.sdk/model/sdk.aontu',
            '.sdk/src/BuildSDK.ts',
            '.sdk/def/petstore.yml',
        ]) {
            node_assert_1.default.ok(s.exists(rel), 'missing generated file: ' + rel);
        }
    });
    (0, node_test_1.test)('excludes-fragment-templates', async () => {
        const s = await scaffold();
        const fragments = s.files().filter((f) => f.includes('.fragment.'));
        node_assert_1.default.deepEqual(fragments, [], 'fragment templates must not be copied verbatim');
    });
    (0, node_test_1.test)('gitignore-content', async () => {
        const s = await scaffold();
        const top = s.read('.gitignore');
        node_assert_1.default.match(top, /node_modules\//);
        node_assert_1.default.match(top, /\.DS_Store/);
        const sdk = s.read('.sdk/.gitignore');
        node_assert_1.default.match(sdk, /dist\//);
        node_assert_1.default.match(sdk, /\*\.tsbuildinfo/);
    });
    (0, node_test_1.test)('def-existing-is-copied-verbatim', async () => {
        const s = await scaffold();
        node_assert_1.default.ok(s.exists('.sdk/def/petstore.yml'));
        node_assert_1.default.equal(s.read('.sdk/def/petstore.yml'), DEF_CONTENT);
    });
    (0, node_test_1.test)('def-missing-writes-placeholder', async () => {
        // Absolute path that does not exist -> placeholder content, basename kept.
        const s = await scaffold({ def: node_path_1.default.join(TMP_ROOT, 'does-not-exist.yml') });
        node_assert_1.default.ok(s.exists('.sdk/def/does-not-exist.yml'));
        node_assert_1.default.match(s.read('.sdk/def/does-not-exist.yml'), /# OpenAPI Definition/);
    });
    (0, node_test_1.test)('def-empty-defaults-to-name-openapi3', async () => {
        // def '' -> spec.def defaults to `${name}-openapi3.yml`.
        const s = await scaffold({ name: 'petstore', def: '' });
        node_assert_1.default.ok(s.exists('.sdk/def/petstore-openapi3.yml'), 'expected defaulted def filename in .sdk/def/');
    });
    (0, node_test_1.test)('sdk-aontu-substitutes-name-and-def', async () => {
        const s = await scaffold({ name: 'petstore' });
        const sdk = s.read('.sdk/model/sdk.aontu');
        // Fragment placeholders NAME/DEF are replaced with the real values.
        node_assert_1.default.match(sdk, /name:\s*'petstore'/);
        node_assert_1.default.match(sdk, /def:\s*'petstore\.yml'/);
        // No unreplaced placeholder tokens remain.
        node_assert_1.default.doesNotMatch(sdk, /'NAME'/);
        node_assert_1.default.doesNotMatch(sdk, /'DEF'/);
    });
    (0, node_test_1.test)('sdk-package-json-substitutes-name', async () => {
        const s = await scaffold({ name: 'petstore' });
        const pkg = JSON.parse(s.read('.sdk/package.json'));
        // `$$const.name$$` etc. are replaced from the model.
        node_assert_1.default.equal(pkg.name, 'build-petstore-sdk');
        // No unresolved jostraca placeholders remain anywhere in the file.
        node_assert_1.default.doesNotMatch(s.read('.sdk/package.json'), /\$\$/);
    });
    (0, node_test_1.test)('dryrun-writes-no-scaffold', async () => {
        const s = await scaffold({ dryrun: true });
        // The scaffold itself is not written on a dry run.
        node_assert_1.default.equal(s.exists('.sdk/model/sdk.aontu'), false);
        node_assert_1.default.equal(s.exists('.sdk/package.json'), false);
        node_assert_1.default.equal(s.exists('.gitignore'), false);
    });
    (0, node_test_1.test)('logCreate-writes-create-log', async () => {
        const s = await scaffold();
        node_assert_1.default.ok(s.exists('.sdk/log/create.log'));
        node_assert_1.default.match(s.read('.sdk/log/create.log'), /CREATE/);
    });
    (0, node_test_1.test)('folder-defaults-append-sdk-suffix', async () => {
        const work = tmpdir('suffix');
        const def = node_path_1.default.join(work, 'x.yml');
        Fs.writeFileSync(def, DEF_CONTENT);
        const orig = process.cwd();
        try {
            process.chdir(work);
            // Name without `-sdk` -> `<name>-sdk` folder.
            await (0, __1.CreateSdkGen)({ debug: 'warn' }).generate({
                root: 'CreateRoot', name: 'alpha', def,
                project: 'standard', folder: '', install: false,
            });
            node_assert_1.default.ok(Fs.existsSync(node_path_1.default.join(work, 'alpha-sdk', '.sdk', 'model', 'sdk.aontu')), 'alpha -> alpha-sdk');
            // Name already ending `-sdk` -> not doubled.
            await (0, __1.CreateSdkGen)({ debug: 'warn' }).generate({
                root: 'CreateRoot', name: 'beta-sdk', def,
                project: 'standard', folder: '', install: false,
            });
            node_assert_1.default.ok(Fs.existsSync(node_path_1.default.join(work, 'beta-sdk', '.sdk', 'model', 'sdk.aontu')), 'beta-sdk -> beta-sdk');
            node_assert_1.default.equal(Fs.existsSync(node_path_1.default.join(work, 'beta-sdk-sdk')), false, 'no double -sdk suffix');
        }
        finally {
            process.chdir(orig);
        }
    });
});
//# sourceMappingURL=create-sdkgen.test.js.map
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
            '.sdk/admin/status.sh',
            '.sdk/admin/check-drift.sh',
            '.sdk/admin/README.md',
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
        // Bare `node_modules` (NO trailing slash) so it also ignores node_modules
        // SYMLINKS (ts/node_modules -> shared tree); a dir-only rule left them tracked.
        node_assert_1.default.match(top, /^node_modules$/m);
        node_assert_1.default.doesNotMatch(top, /^node_modules\/$/m);
        node_assert_1.default.match(top, /\.DS_Store/);
        const sdk = s.read('.sdk/.gitignore');
        // Same guard for .sdk/node_modules -> shared tree symlink.
        node_assert_1.default.match(sdk, /^node_modules$/m);
        node_assert_1.default.match(sdk, /dist\//);
        node_assert_1.default.match(sdk, /\*\.tsbuildinfo/);
    });
    (0, node_test_1.test)('def-existing-is-copied-verbatim', async () => {
        const s = await scaffold();
        node_assert_1.default.ok(s.exists('.sdk/def/petstore.yml'));
        node_assert_1.default.equal(s.read('.sdk/def/petstore.yml'), DEF_CONTENT);
    });
    (0, node_test_1.test)('def-given-but-missing-throws', async () => {
        // A given --def must resolve; omitting it (see
        // def-empty-defaults-to-name-openapi3) legitimately gets a placeholder.
        const badPath = node_path_1.default.join(TMP_ROOT, 'does-not-exist.yml');
        await node_assert_1.default.rejects(() => scaffold({ def: badPath }), /OpenAPI definition file not found/);
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
    // What @voxgig/apidef ships in model/, and what it writes under .sdk/model.
    const APIDEF_INCLUDES = [
        '@voxgig/apidef/model/apidef.aontu',
        'api/api-info.aontu',
        'entity/entity-index.aontu',
        'flow/flow-index.aontu',
    ];
    (0, node_test_1.test)('sdk-aontu-names-apidef-files-as-aontu', async () => {
        const s = await scaffold();
        const sdk = s.read('.sdk/model/sdk.aontu');
        for (const include of APIDEF_INCLUDES) {
            node_assert_1.default.ok(sdk.includes('@"' + include + '"'), 'sdk.aontu must include ' + include);
        }
        node_assert_1.default.doesNotMatch(sdk, /@"[^"]*\.aon"/, 'no include may name a retired .aon file');
    });
    // `target add` unifies sdk.aontu before apidef has written anything, so every
    // local include needs a scaffolded placeholder under the name apidef writes.
    (0, node_test_1.test)('sdk-aontu-local-includes-resolve-before-apidef-runs', async () => {
        const s = await scaffold();
        const sdk = s.read('.sdk/model/sdk.aontu');
        const local = [...sdk.matchAll(/^@"([^"@][^"]*)"/gm)].map((m) => m[1]);
        node_assert_1.default.ok(local.includes('api/api-info.aontu'), 'the scan must see the apidef files');
        for (const include of local) {
            node_assert_1.default.ok(s.exists(node_path_1.default.join('.sdk', 'model', include)), 'sdk.aontu includes a file the scaffold does not write: ' + include);
        }
    });
    // The first releases that ship and write only .aontu, and the aontu that
    // refuses a .aon include.
    const AONTU_FLOORS = {
        '@voxgig/apidef': '>=8.16.0',
        '@voxgig/sdkgen': '>=4.25.0',
        '@voxgig/docgen': '>=0.27.0',
        'aontu': '>=0.75.0',
        'jostraca': '>=0.39.0',
    };
    (0, node_test_1.test)('scaffold-requires-a-toolchain-that-reads-only-aontu', async () => {
        const s = await scaffold();
        const pkg = JSON.parse(s.read('.sdk/package.json'));
        for (const [name, floor] of Object.entries(AONTU_FLOORS)) {
            node_assert_1.default.equal(pkg.devDependencies[name], floor, name);
        }
    });
    (0, node_test_1.test)('sdk-package-json-substitutes-name', async () => {
        const s = await scaffold({ name: 'petstore' });
        const pkg = JSON.parse(s.read('.sdk/package.json'));
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
    (0, node_test_1.test)('dryrun-writes-nothing-at-all', async () => {
        const s = await scaffold({ dryrun: true });
        node_assert_1.default.deepEqual(s.files(), [], 'a dry run must not create any file, including the create log');
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
(0, node_test_1.describe)('guide-overlay-merge', () => {
    const GUIDE_REL = node_path_1.default.join('.sdk', 'model', 'guide', 'guide.aontu');
    // Re-scaffold over an EXISTING project folder (the regen flow).
    async function rescaffold(out, def) {
        await (0, __1.CreateSdkGen)({ debug: 'warn' }).generate({
            root: 'CreateRoot', name: 'petstore', def,
            project: 'standard', folder: out, install: false,
        });
    }
    (0, node_test_1.test)('a fresh scaffold writes the guide template', async () => {
        const s = await scaffold();
        const guide = s.read(GUIDE_REL);
        node_assert_1.default.match(guide, /@"@voxgig\/apidef\/model\/guide\.aontu"/);
        node_assert_1.default.match(guide, /@"\.\/base-guide\.aontu"/);
        node_assert_1.default.equal(s.exists(node_path_1.default.join('.sdk', 'model', 'guide', 'guide.aon')), false, 'apidef reads the guide entry as guide.aontu only');
    });
    (0, node_test_1.test)('a re-scaffold leaves a customized guide BYTE-IDENTICAL', async () => {
        const s = await scaffold();
        const guidePath = node_path_1.default.join(s.out, GUIDE_REL);
        const customized = s.read(GUIDE_REL) +
            '\n# USER CUSTOMIZATION\nguide: entity: { widget: active: false }\n';
        Fs.writeFileSync(guidePath, customized);
        await rescaffold(s.out, node_path_1.default.join(s.work, 'petstore.yml'));
        node_assert_1.default.equal(Fs.readFileSync(guidePath, 'utf8'), customized, 'the user overlay must survive a re-scaffold untouched');
    });
    (0, node_test_1.test)('a re-scaffold restores includes the guide is missing, keeping user content', async () => {
        const s = await scaffold();
        const guidePath = node_path_1.default.join(s.out, GUIDE_REL);
        const damaged = '# only my stuff\nguide: entity: { widget: active: false }\n';
        Fs.writeFileSync(guidePath, damaged);
        await rescaffold(s.out, node_path_1.default.join(s.work, 'petstore.yml'));
        const merged = Fs.readFileSync(guidePath, 'utf8');
        node_assert_1.default.match(merged, /@"@voxgig\/apidef\/model\/guide\.aontu"/);
        node_assert_1.default.match(merged, /@"\.\/base-guide\.aontu"/);
        node_assert_1.default.match(merged, /guide: entity: \{ widget: active: false \}/);
        // Restored at the TOP: the overrides unify over base-guide, so the
        // includes have to precede them.
        node_assert_1.default.ok(merged.indexOf('@"./base-guide.aontu"') < merged.indexOf('# only my stuff'), 'includes must be restored before the user content');
    });
    (0, node_test_1.test)('the rest of the scaffold is still overwritten', async () => {
        const s = await scaffold();
        const sdkAontu = node_path_1.default.join(s.out, '.sdk', 'model', 'sdk.aontu');
        Fs.writeFileSync(sdkAontu, '# clobbered\n');
        await rescaffold(s.out, node_path_1.default.join(s.work, 'petstore.yml'));
        node_assert_1.default.notEqual(Fs.readFileSync(sdkAontu, 'utf8'), '# clobbered\n', 'toolchain-derived files must still be overwritten so fixes propagate');
    });
});
(0, node_test_1.describe)('project-overlay', () => {
    const PROJECT_REL = node_path_1.default.join('.sdk', 'model', 'project.aontu');
    const SDK_REL = node_path_1.default.join('.sdk', 'model', 'sdk.aontu');
    async function rescaffold(out, def) {
        await (0, __1.CreateSdkGen)({ debug: 'warn' }).generate({
            root: 'CreateRoot', name: 'petstore', def,
            project: 'standard', folder: out, install: false,
        });
    }
    (0, node_test_1.test)('a fresh scaffold writes the stub, and sdk.aontu includes it LAST', async () => {
        const s = await scaffold();
        node_assert_1.default.equal(s.exists(PROJECT_REL), true);
        const sdk = s.read(SDK_REL);
        node_assert_1.default.match(sdk, /@"\.\/project\.aontu"/);
        // Order is load-bearing: a key under main.kit.target.<t> can only refine a
        // target that target-index.aontu has already defined. Declared earlier the
        // model build dies on "key ext value was: nil".
        node_assert_1.default.ok(sdk.indexOf('@"./project.aontu"') >
            sdk.indexOf('@"target/target-index.aontu"'), 'project.aontu must be included after target-index.aontu');
    });
    (0, node_test_1.test)('a re-scaffold leaves a customized project overlay BYTE-IDENTICAL', async () => {
        const s = await scaffold();
        const projectPath = node_path_1.default.join(s.out, PROJECT_REL);
        const customized = s.read(PROJECT_REL) +
            "\nmain: kit: target: ts: publish: version: '1.2.3'\n";
        Fs.writeFileSync(projectPath, customized);
        await rescaffold(s.out, node_path_1.default.join(s.work, 'petstore.yml'));
        node_assert_1.default.equal(Fs.readFileSync(projectPath, 'utf8'), customized, 'a declared release version must survive a re-scaffold');
    });
    (0, node_test_1.test)('sdk.aontu itself is still template-owned, so a renamed def propagates', async () => {
        const s = await scaffold();
        node_assert_1.default.match(s.read(SDK_REL), /def: 'petstore\.yml'/);
        const renamed = node_path_1.default.join(s.work, 'petstore-v2-swagger-2.0.yml');
        Fs.writeFileSync(renamed, DEF_CONTENT);
        await rescaffold(s.out, renamed);
        node_assert_1.default.match(s.read(SDK_REL), /def: 'petstore-v2-swagger-2\.0\.yml'/);
    });
});
(0, node_test_1.describe)('index-preservation', () => {
    const TEMPLATE_MODEL = node_path_1.default.resolve(__dirname, '..', 'project', 'standard', '.sdk', 'model');
    // What `target add`, `feature add` and docgen's first install leave behind.
    const ADDED = {
        target: '# SDK Targets.\n\n\n@"./ts.aontu"',
        feature: '# Features\n\n\n\n@"./test.aontu"',
        edition: '# Populated by docgen when the project toolchain is installed.\n\n' +
            '@"./summary.aontu"\n\n@"./github-pages.aontu"\n',
    };
    const indexRel = (kind) => node_path_1.default.join('.sdk', 'model', kind, kind + '-index.aontu');
    async function rescaffold(s) {
        await (0, __1.CreateSdkGen)({ debug: 'warn' }).generate({
            root: 'CreateRoot', name: 'petstore', def: node_path_1.default.join(s.work, 'petstore.yml'),
            project: 'standard', folder: s.out, install: false,
        });
    }
    (0, node_test_1.test)('a fresh scaffold writes each index placeholder', async () => {
        const s = await scaffold();
        for (const kind of Object.keys(ADDED)) {
            node_assert_1.default.equal(s.read(indexRel(kind)), Fs.readFileSync(node_path_1.default.join(TEMPLATE_MODEL, kind, kind + '-index.aontu'), 'utf8'), kind + ' index');
        }
    });
    (0, node_test_1.test)('a re-scaffold keeps every target, feature and edition entry', async () => {
        const s = await scaffold();
        for (const [kind, content] of Object.entries(ADDED)) {
            Fs.writeFileSync(node_path_1.default.join(s.out, indexRel(kind)), content);
        }
        await rescaffold(s);
        // docgen records its bootstrap and never re-adds an edition, so a reset
        // index would drop every one of them from the model for good.
        for (const [kind, content] of Object.entries(ADDED)) {
            node_assert_1.default.equal(s.read(indexRel(kind)), content, kind + ' index must survive');
        }
    });
});
(0, node_test_1.describe)('overlay-extension-migration', () => {
    const GUIDE = node_path_1.default.join('.sdk', 'model', 'guide', 'guide.aontu');
    const GUIDE_OLD = node_path_1.default.join('.sdk', 'model', 'guide', 'guide.aon');
    const PROJ = node_path_1.default.join('.sdk', 'model', 'project.aontu');
    const PROJ_OLD = node_path_1.default.join('.sdk', 'model', 'project.aon');
    async function rescaffold(out, def, dryrun = false) {
        await (0, __1.CreateSdkGen)({ debug: 'warn' }).generate({
            root: 'CreateRoot', name: 'petstore', def,
            project: 'standard', folder: out, install: false, dryrun,
        });
    }
    (0, node_test_1.test)('a legacy guide.aon is renamed to guide.aontu, keeping its customizations', async () => {
        const s = await scaffold();
        const customized = s.read(GUIDE) +
            '\n# USER CUSTOMIZATION\nguide: entity: { widget: active: false }\n';
        // Put the project back into its pre-rename shape, includes and all.
        Fs.writeFileSync(node_path_1.default.join(s.out, GUIDE_OLD), customized.replace(/\.aontu"/g, '.aon"'));
        Fs.rmSync(node_path_1.default.join(s.out, GUIDE));
        await rescaffold(s.out, node_path_1.default.join(s.work, 'petstore.yml'));
        node_assert_1.default.equal(Fs.existsSync(node_path_1.default.join(s.out, GUIDE_OLD)), false, 'the legacy file must be gone, not left behind to be ignored');
        node_assert_1.default.equal(s.read(GUIDE), customized, 'the customizations must survive the rename byte-for-byte');
    });
    (0, node_test_1.test)('a legacy project.aon is renamed, keeping the release version', async () => {
        const s = await scaffold();
        const declared = s.read(PROJ) +
            "\nmain: kit: target: ts: publish: version: '1.2.3'\n";
        Fs.writeFileSync(node_path_1.default.join(s.out, PROJ_OLD), declared);
        Fs.rmSync(node_path_1.default.join(s.out, PROJ));
        await rescaffold(s.out, node_path_1.default.join(s.work, 'petstore.yml'));
        node_assert_1.default.equal(Fs.existsSync(node_path_1.default.join(s.out, PROJ_OLD)), false);
        node_assert_1.default.match(s.read(PROJ), /version: '1\.2\.3'/, 'an ignored project overlay resets every manifest to 0.0.1');
    });
    (0, node_test_1.test)('migration is a no-op once the .aontu files exist', async () => {
        const s = await scaffold();
        const before = s.read(GUIDE);
        await rescaffold(s.out, node_path_1.default.join(s.work, 'petstore.yml'));
        node_assert_1.default.equal(s.read(GUIDE), before);
        node_assert_1.default.equal(Fs.existsSync(node_path_1.default.join(s.out, GUIDE_OLD)), false);
    });
    (0, node_test_1.test)('when both exist, guide.aontu wins and guide.aon is left alone', async () => {
        const s = await scaffold();
        const current = s.read(GUIDE) + '\n# CURRENT\nguide: entity: { widget: active: false }\n';
        const stale = '@"@voxgig/apidef/model/guide.aon"\n# STALE\n';
        Fs.writeFileSync(node_path_1.default.join(s.out, GUIDE), current);
        Fs.writeFileSync(node_path_1.default.join(s.out, GUIDE_OLD), stale);
        await rescaffold(s.out, node_path_1.default.join(s.work, 'petstore.yml'));
        node_assert_1.default.equal(s.read(GUIDE), current, 'the .aontu entry must not be replaced');
        node_assert_1.default.equal(s.read(GUIDE_OLD), stale, 'apidef leaves the stale file too');
    });
    (0, node_test_1.test)('a dry run migrates nothing', async () => {
        const s = await scaffold();
        const guide = s.read(GUIDE).replace(/\.aontu"/g, '.aon"') + '\n# MINE\n';
        const project = s.read(PROJ) + "\nmain: kit: target: ts: publish: version: '1.2.3'\n";
        const item = node_path_1.default.join('.sdk', 'model', 'target', 'ts.aon');
        Fs.writeFileSync(node_path_1.default.join(s.out, GUIDE_OLD), guide);
        Fs.rmSync(node_path_1.default.join(s.out, GUIDE));
        Fs.writeFileSync(node_path_1.default.join(s.out, PROJ_OLD), project);
        Fs.rmSync(node_path_1.default.join(s.out, PROJ));
        Fs.writeFileSync(node_path_1.default.join(s.out, item), 'main: kit: target: ts: {}\n');
        await rescaffold(s.out, node_path_1.default.join(s.work, 'petstore.yml'), true);
        node_assert_1.default.equal(s.read(GUIDE_OLD), guide, 'a dry run must not migrate the guide');
        node_assert_1.default.equal(Fs.existsSync(node_path_1.default.join(s.out, GUIDE)), false);
        node_assert_1.default.equal(s.read(PROJ_OLD), project, 'a dry run must not migrate the project');
        node_assert_1.default.equal(Fs.existsSync(node_path_1.default.join(s.out, PROJ)), false);
        node_assert_1.default.equal(s.exists(item), true, 'a dry run must not migrate an item');
        node_assert_1.default.equal(s.exists(item + 'tu'), false);
    });
});
(0, node_test_1.describe)('overlay-include-migration', () => {
    const GUIDE = node_path_1.default.join('.sdk', 'model', 'guide', 'guide.aontu');
    const GUIDE_OLD = node_path_1.default.join('.sdk', 'model', 'guide', 'guide.aon');
    const LEGACY_INCLUDES = '@"@voxgig/apidef/model/guide.aon"\n' +
        "@'petstore-base-guide.aon'\n" +
        '@"./shared.aon"\n' +
        '\n# USER CUSTOMIZATION\nguide: entity: { widget: active: false }\n';
    const SHARED = node_path_1.default.join('.sdk', 'model', 'guide', 'shared');
    const SHARED_CONTENT = "# the project's own file\nguide: entity: { gadget: active: false }\n";
    async function rescaffold(s) {
        await (0, __1.CreateSdkGen)({ debug: 'warn' }).generate({
            root: 'CreateRoot', name: 'petstore', def: node_path_1.default.join(s.work, 'petstore.yml'),
            project: 'standard', folder: s.out, install: false,
        });
    }
    function assertAontuIncludes(s) {
        const got = s.read(GUIDE);
        node_assert_1.default.doesNotMatch(got, /\.aon['"]/, 'aontu refuses every .aon include');
        node_assert_1.default.match(got, /@"\.\/shared\.aontu"/, "a project's own include follows its file");
        node_assert_1.default.equal(s.read(SHARED + '.aontu'), SHARED_CONTENT, "the project's own file is renamed, byte for byte");
        node_assert_1.default.equal(s.exists(SHARED + '.aon'), false);
        node_assert_1.default.match(got, /@"@voxgig\/apidef\/model\/guide\.aontu"/);
        node_assert_1.default.match(got, /@'petstore-base-guide\.aontu'/, 'single-quoted includes too');
        node_assert_1.default.match(got, /widget: active: false/, 'user content is untouched');
        node_assert_1.default.equal(got.split('@voxgig/apidef/model/guide.aontu').length, 2, 'the renamed include must satisfy the merge, not gain a duplicate');
    }
    (0, node_test_1.test)('a migrated guide has its includes renamed too', async () => {
        const s = await scaffold();
        Fs.writeFileSync(node_path_1.default.join(s.out, GUIDE_OLD), LEGACY_INCLUDES);
        Fs.writeFileSync(node_path_1.default.join(s.out, SHARED + '.aon'), SHARED_CONTENT);
        Fs.rmSync(node_path_1.default.join(s.out, GUIDE));
        await rescaffold(s);
        assertAontuIncludes(s);
    });
    (0, node_test_1.test)('a guide.aontu that still includes .aon files has them renamed', async () => {
        const s = await scaffold();
        Fs.writeFileSync(node_path_1.default.join(s.out, GUIDE), LEGACY_INCLUDES);
        Fs.writeFileSync(node_path_1.default.join(s.out, SHARED + '.aon'), SHARED_CONTENT);
        await rescaffold(s);
        assertAontuIncludes(s);
    });
});
(0, node_test_1.describe)('aon-era-migration', () => {
    const SDK = '.sdk';
    const MODEL = node_path_1.default.join(SDK, 'model');
    // What an index and an item looked like before the rename: sdkgen and docgen
    // wrote both, and an item includes its package's own model.
    const LEGACY = {
        target: {
            index: '# SDK Targets.\n\n\n@"./ts.aon"',
            item: 'ts',
            body: "\nmain: kit: target: ts: {\n  title: TypeScript\n  comment: line: \"//\"\n}\n",
        },
        feature: {
            index: '# Features\n\n\n\n@"./test.aon"',
            item: 'test',
            body: '@"@voxgig/sdkgen/model/sdkgen.aon"\n\nmain: kit: feature: test: {\n' +
                "  title: 'In-memory mock transport; see test.aon'\n}\n",
        },
        edition: {
            index: '# Populated by docgen when the project toolchain is installed.\n\n' +
                '@"./summary.aon"\n\n@"./github-pages.aon"\n',
            item: 'summary',
            body: '@"@voxgig/docgen/model/docgen.aon"\n' +
                "main: kit: doc: edition: 'summary': {\n  kind: 'summary'\n}\n",
        },
    };
    const PAGES = '@"@voxgig/docgen/model/docgen.aon"\n' +
        "main: kit: doc: edition: 'github-pages': { kind: 'github-pages' }\n";
    const COMMON = '# @"@voxgig/sdkgen/model/sdkgen.aon" in a comment is not an include\n' +
        "common: { note: '@\"@voxgig/sdkgen/model/sdkgen.aon\" as data is not one either' }\n";
    const PROJECT_OVERLAY = "@\"./shared/common.aon\"\nmain: kit: target: ts: publish: version: '1.2.3'\n";
    const MINE = 'mine: { basic: pending: "a case the project wrote itself" }\n';
    function recorder() {
        const warnings = [];
        const log = {
            level: 'warn',
            child: () => log,
            trace: () => null, debug: () => null, info: () => null,
            error: () => null, fatal: () => null,
            warn: (entry) => warnings.push(entry),
        };
        return { log, warnings };
    }
    async function rescaffold(s, over = {}) {
        await (0, __1.CreateSdkGen)({ debug: 'warn', ...over }).generate({
            root: 'CreateRoot', name: 'petstore', def: node_path_1.default.join(s.work, 'petstore.yml'),
            project: 'standard', folder: s.out, install: false,
        });
    }
    const write = (s, rel, content) => {
        Fs.mkdirSync(node_path_1.default.dirname(node_path_1.default.join(s.out, rel)), { recursive: true });
        Fs.writeFileSync(node_path_1.default.join(s.out, rel), content);
    };
    const underSdk = (s, ext) => s.files()
        .filter((f) => /^\.sdk\/(model|test)\//.test(f) && f.endsWith(ext));
    // A project as create-sdkgen 0.27 and the toolchain around it left it.
    async function legacyProject() {
        const s = await scaffold();
        const scaffolded = underSdk(s, '.aontu').filter((f) => !/\/(api|entity|flow|guide)\//.test(f));
        for (const rel of scaffolded) {
            const content = s.read(rel);
            Fs.rmSync(node_path_1.default.join(s.out, rel));
            write(s, rel.replace(/\.aontu$/, '.aon'), content);
        }
        for (const [kind, legacy] of Object.entries(LEGACY)) {
            write(s, node_path_1.default.join(MODEL, kind, kind + '-index.aon'), legacy.index);
            write(s, node_path_1.default.join(MODEL, kind, legacy.item + '.aon'), legacy.body);
        }
        write(s, node_path_1.default.join(MODEL, 'edition', 'github-pages.aon'), PAGES);
        write(s, node_path_1.default.join(MODEL, 'project.aon'), PROJECT_OVERLAY);
        write(s, node_path_1.default.join(MODEL, 'shared', 'common.aon'), COMMON);
        write(s, node_path_1.default.join(SDK, 'test', 'mine.aon'), MINE);
        return { s, scaffolded };
    }
    const LEGACY_INCLUDE_RE = /@\s*(["'`])[^"'`\n]*\.aon\1/;
    (0, node_test_1.test)('a re-scaffold leaves nothing aontu refuses', async () => {
        const { s } = await legacyProject();
        node_assert_1.default.ok(20 < underSdk(s, '.aon').length, 'the fixture must be .aon-era');
        await rescaffold(s);
        node_assert_1.default.deepEqual(underSdk(s, '.aon'), [], 'no .aon file may remain');
        for (const rel of underSdk(s, '.aontu')) {
            const code = s.read(rel).split('\n').filter((line) => !/^\s*#/.test(line));
            node_assert_1.default.doesNotMatch(code.join('\n').replace(/'[^'\n]*'/g, "''"), LEGACY_INCLUDE_RE, rel + ' still includes a .aon file');
        }
    });
    (0, node_test_1.test)('each index keeps its entries, renamed with its items', async () => {
        const { s } = await legacyProject();
        await rescaffold(s);
        for (const [kind, legacy] of Object.entries(LEGACY)) {
            node_assert_1.default.equal(s.read(node_path_1.default.join(MODEL, kind, kind + '-index.aontu')), legacy.index.replace(/\.aon"/g, '.aontu"'), kind + ' index');
            node_assert_1.default.equal(s.read(node_path_1.default.join(MODEL, kind, legacy.item + '.aontu')), legacy.body.replace(/(@"@voxgig\/[^"]+)\.aon"/g, '$1.aontu"'), kind + ' item');
        }
        node_assert_1.default.match(s.read(node_path_1.default.join(MODEL, 'edition', 'github-pages.aontu')), /^@"@voxgig\/docgen\/model\/docgen\.aontu"\n/);
    });
    (0, node_test_1.test)("the project's own files are renamed, never dropped", async () => {
        const { s } = await legacyProject();
        await rescaffold(s);
        node_assert_1.default.equal(s.read(node_path_1.default.join(MODEL, 'project.aontu')), PROJECT_OVERLAY.replace('common.aon"', 'common.aontu"'));
        node_assert_1.default.equal(s.read(node_path_1.default.join(MODEL, 'shared', 'common.aontu')), COMMON, 'only include directives are rewritten, not comments or data');
        node_assert_1.default.equal(s.read(node_path_1.default.join(SDK, 'test', 'mine.aontu')), MINE);
    });
    (0, node_test_1.test)("the scaffold's own .aon files give way to their .aontu twins", async () => {
        const { s, scaffolded } = await legacyProject();
        await rescaffold(s);
        for (const rel of scaffolded) {
            node_assert_1.default.equal(s.exists(rel), true, rel + ' is written');
            node_assert_1.default.equal(s.exists(rel.replace(/\.aontu$/, '.aon')), false, rel + ' legacy removed');
        }
        for (const rel of ['model/sdk.aontu', 'model/config.aontu',
            'model/.model-config/model-config.aontu', 'test/test.aontu']) {
            node_assert_1.default.ok(scaffolded.includes('.sdk/' + rel), 'the fixture must cover ' + rel);
        }
        node_assert_1.default.equal(s.exists(node_path_1.default.join(MODEL, 'sdk.aon')), false);
    });
    (0, node_test_1.test)('when both exist, the .aontu item wins and the .aon one is reported', async () => {
        const s = await scaffold();
        const item = node_path_1.default.join(MODEL, 'target', 'ts');
        write(s, item + '.aontu', 'main: kit: target: ts: { title: Current }\n');
        write(s, item + '.aon', 'main: kit: target: ts: { title: Stale }\n');
        const { log, warnings } = recorder();
        await rescaffold(s, { pino: log });
        node_assert_1.default.match(s.read(item + '.aontu'), /Current/);
        node_assert_1.default.match(s.read(item + '.aon'), /Stale/);
        node_assert_1.default.ok(warnings.some((w) => /model\/target\/ts\.aon: left in place/.test(w.note)), JSON.stringify(warnings));
    });
    (0, node_test_1.test)('an include that cannot be migrated is reported, not left silently', async () => {
        const s = await scaffold();
        const outside = '@"../../shared.aon"\n';
        write(s, 'shared.aon', 'outside: true\n');
        write(s, node_path_1.default.join(MODEL, 'project.aontu'), outside);
        const { log, warnings } = recorder();
        await rescaffold(s, { pino: log });
        node_assert_1.default.equal(s.read(node_path_1.default.join(MODEL, 'project.aontu')), outside);
        node_assert_1.default.equal(s.read('shared.aon'), 'outside: true\n', 'nothing outside .sdk is touched');
        node_assert_1.default.ok(warnings.some((w) => /model\/project\.aontu: includes \.\.\/\.\.\/shared\.aon/.test(w.note)), JSON.stringify(warnings));
    });
    (0, node_test_1.test)('a failed migration does not fail the scaffold', async () => {
        const { s } = await legacyProject();
        const fs = {
            ...Fs,
            writeFileSync: (path, ...rest) => {
                if (String(path).endsWith(node_path_1.default.join('target', 'ts.aontu'))) {
                    throw new Error('disk full');
                }
                return Fs.writeFileSync(path, ...rest);
            },
        };
        const { log, warnings } = recorder();
        await rescaffold(s, { fs, pino: log });
        node_assert_1.default.equal(s.read(node_path_1.default.join(MODEL, 'target', 'ts.aon')), LEGACY.target.body);
        node_assert_1.default.equal(s.read(node_path_1.default.join(MODEL, 'target', 'target-index.aontu')), LEGACY.target.index, 'an include is renamed only once its file is');
        node_assert_1.default.ok(s.exists(node_path_1.default.join(MODEL, 'sdk.aontu')), 'the rest of the scaffold is written');
        node_assert_1.default.ok(warnings.some((w) => /target-index\.aontu: includes \.\/ts\.aon/.test(w.note)), JSON.stringify(warnings));
    });
});
(0, node_test_1.test)('new projects prepare documentation editions through docgen', async () => {
    const p = await scaffold();
    const pkg = JSON.parse(p.read('.sdk/package.json'));
    node_assert_1.default.equal(pkg.devDependencies['@voxgig/docgen'], '>=0.27.0');
    node_assert_1.default.equal(pkg.scripts.postinstall, 'node build/docgen.js');
    node_assert_1.default.match(pkg.scripts.generate, /^node build\/docgen\.js/);
    node_assert_1.default.match(p.read('.sdk/build/docgen.js'), /prepareProject/);
    node_assert_1.default.match(p.read('.sdk/model/sdk.aontu'), /edition\/edition-index\.aontu/);
    node_assert_1.default.ok(!p.exists('.sdk/src/DocStaticRoot.ts'));
});
(0, node_test_1.test)('admin status launcher is executable, preserved on dry run, and leaves project scripts alone', async () => {
    const s = await scaffold();
    const file = node_path_1.default.join(s.out, '.sdk/admin/status.sh');
    node_assert_1.default.match(s.read('.sdk/admin/status.sh'), /sdkgen\/dist\/admin\/status.js/);
    if (process.platform !== 'win32')
        node_assert_1.default.ok(Fs.statSync(file).mode & 0o111);
    node_assert_1.default.equal(JSON.parse(s.read('.sdk/package.json')).scripts.status, 'bash admin/status.sh');
    // EVERY .sh in the scaffold's admin folder, not just status.sh: CreateRoot
    // reads the directory, so a script added there is scaffolded and made
    // executable with no code change - and this is what holds that true.
    const drift = node_path_1.default.join(s.out, '.sdk/admin/check-drift.sh');
    node_assert_1.default.match(s.read('.sdk/admin/check-drift.sh'), /deleting and regenerating every target/);
    if (process.platform !== 'win32')
        node_assert_1.default.ok(Fs.statSync(drift).mode & 0o111);
    node_assert_1.default.equal(JSON.parse(s.read('.sdk/package.json'))
        .scripts['check-drift'], 'bash admin/check-drift.sh');
    node_assert_1.default.ok(!s.exists('.sdk/admin/setup-github-pages.sh'), 'Pages setup belongs to docgen generation');
    Fs.writeFileSync(node_path_1.default.join(s.out, '.sdk/admin/custom.sh'), '# project script\n');
    const csg = (0, __1.CreateSdkGen)({ debug: 'warn' });
    await csg.generate({ root: 'CreateRoot', name: 'petstore', def: node_path_1.default.join(s.out, '.sdk/def/petstore.yml'), project: 'standard', folder: s.out, install: false, dryrun: false });
    node_assert_1.default.equal(s.read('.sdk/admin/custom.sh'), '# project script\n');
    const dry = await scaffold({ dryrun: true });
    node_assert_1.default.ok(!dry.exists('.sdk/admin/status.sh'));
});
//# sourceMappingURL=create-sdkgen.test.js.map
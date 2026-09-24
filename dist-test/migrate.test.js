"use strict";
/* Copyright (c) 2026 Richard Rodger, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
const migrate_1 = require("../dist/project/standard/migrate");
(0, node_test_1.describe)('rewrite-includes', () => {
    const all = (src) => (0, migrate_1.rewriteIncludes)(src, () => true);
    (0, node_test_1.test)('renames an include in each quote style, spacing kept', () => {
        (0, node_assert_1.equal)(all('@"./a.aon"\n'), '@"./a.aontu"\n');
        (0, node_assert_1.equal)(all("@'./a.aon'\n"), "@'./a.aontu'\n");
        (0, node_assert_1.equal)(all('@`./a.aon`\n'), '@`./a.aontu`\n');
        (0, node_assert_1.equal)(all('@ "./a.aon"\n'), '@ "./a.aontu"\n');
        (0, node_assert_1.equal)(all('feature: cost: @"./cost.aon"  # one case\n'), 'feature: cost: @"./cost.aontu"  # one case\n');
    });
    (0, node_test_1.test)('leaves a comment and string data alone', () => {
        for (const src of [
            '# @"./a.aon"\n',
            'x: 1  # @"./a.aon"\n',
            "note: '@\"./a.aon\"'\n",
            'note: "@\'./a.aon\'"\n',
            'note: `\n@"./a.aon"\n`\n',
            'path: "./a.aon"\n',
        ]) {
            (0, node_assert_1.equal)(all(src), src);
        }
    });
    (0, node_test_1.test)('renames only what the caller says has moved', () => {
        (0, node_assert_1.equal)((0, migrate_1.rewriteIncludes)('@"./a.aon"\n@"./b.aon"\n', (path) => './a.aon' === path), '@"./a.aontu"\n@"./b.aon"\n');
    });
    (0, node_test_1.test)('leaves an include already named .aontu, or of another kind, alone', () => {
        for (const src of ['@"./a.aontu"\n', '@"./a.json"\n', '@"./a"\n']) {
            (0, node_assert_1.equal)(all(src), src);
        }
    });
});
(0, node_test_1.describe)('migrate-to-aontu', () => {
    const none = { kept: new Set(), replaced: new Set() };
    const body = 'x: 1\n'.repeat(20);
    function project(files) {
        const sdk = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'migrate-'));
        for (const [rel, text] of Object.entries(files)) {
            node_fs_1.default.mkdirSync(node_path_1.default.dirname(node_path_1.default.join(sdk, rel)), { recursive: true });
            node_fs_1.default.writeFileSync(node_path_1.default.join(sdk, rel), text);
        }
        return sdk;
    }
    const read = (sdk, rel) => node_fs_1.default.readFileSync(node_path_1.default.join(sdk, rel), 'utf8');
    const leftovers = (sdk) => node_fs_1.default.readdirSync(sdk, { recursive: true })
        .filter((rel) => rel.endsWith('.migrating'));
    // A disk that fills mid-write: half the bytes land, then the write fails.
    const filling = {
        ...node_fs_1.default,
        writeFileSync: (path, data) => {
            const text = String(data);
            node_fs_1.default.writeFileSync(path, text.slice(0, Math.floor(text.length / 2)));
            throw new Error('ENOSPC: no space left on device');
        },
    };
    (0, node_test_1.test)('a rewrite that fails part way leaves the model file whole', () => {
        const src = '@"./shared.aon"\n' + body;
        const sdk = project({ 'model/project.aontu': src, 'model/shared.aontu': 'y: 2\n' });
        try {
            (0, migrate_1.migrateToAontu)(filling, sdk, none, () => { });
            (0, node_assert_1.equal)(read(sdk, 'model/project.aontu'), src);
            (0, node_assert_1.equal)(leftovers(sdk).length, 0);
        }
        finally {
            node_fs_1.default.rmSync(sdk, { recursive: true, force: true });
        }
    });
    (0, node_test_1.test)('a rename that fails part way keeps the .aon original, and nothing else', () => {
        const sdk = project({ 'model/mine.aon': body });
        try {
            (0, migrate_1.migrateToAontu)(filling, sdk, none, () => { });
            (0, node_assert_1.equal)(read(sdk, 'model/mine.aon'), body);
            (0, node_assert_1.ok)(!node_fs_1.default.existsSync(node_path_1.default.join(sdk, 'model/mine.aontu')));
            (0, node_assert_1.equal)(leftovers(sdk).length, 0);
        }
        finally {
            node_fs_1.default.rmSync(sdk, { recursive: true, force: true });
        }
    });
    (0, node_test_1.test)('only the base guide apidef writes is renamed before it exists', () => {
        const sdk = project({
            'model/project.aontu': '@"../../outside/x-base-guide.aon"\n@"./guide/x-base-guide.aon"\n',
        });
        const notes = [];
        try {
            (0, migrate_1.migrateToAontu)(node_fs_1.default, sdk, none, (_file, note) => notes.push(note));
            (0, node_assert_1.equal)(read(sdk, 'model/project.aontu'), '@"../../outside/x-base-guide.aon"\n@"./guide/x-base-guide.aontu"\n');
            (0, node_assert_1.ok)(notes.some((n) => n.includes('outside/x-base-guide.aon')), notes.join('\n'));
        }
        finally {
            node_fs_1.default.rmSync(sdk, { recursive: true, force: true });
        }
    });
});
//# sourceMappingURL=migrate.test.js.map
"use strict";
/* Copyright (c) 2026 Richard Rodger, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_child_process_1 = __importDefault(require("node:child_process"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
const SCRIPT = node_path_1.default.resolve(__dirname, '..', 'project', 'standard', '.sdk', 'admin', 'check-drift.sh');
const made = [];
(0, node_test_1.after)(() => made.forEach((dir) => node_fs_1.default.rmSync(dir, { recursive: true, force: true })));
// A project whose `npm run generate` writes `emit` and nothing else, committed
// with `tree` besides, so a file in `tree` but not in `emit` is stale output.
function project(target, tree, emit) {
    const dir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'check-drift-'));
    made.push(dir);
    const write = (file, text) => {
        node_fs_1.default.mkdirSync(node_path_1.default.dirname(node_path_1.default.join(dir, file)), { recursive: true });
        node_fs_1.default.writeFileSync(node_path_1.default.join(dir, file), text);
    };
    write('.sdk/admin/check-drift.sh', node_fs_1.default.readFileSync(SCRIPT, 'utf8'));
    write('.sdk/model/sdk.json', JSON.stringify({ main: { kit: { target } } }));
    write('.sdk/emit.json', JSON.stringify(emit));
    write('.sdk/generate.js', 'const Fs = require("node:fs"), Path = require("node:path")\n' +
        'for (const [f, t] of Object.entries(require("./emit.json"))) {\n' +
        '  Fs.mkdirSync(Path.dirname(Path.join("..", f)), { recursive: true })\n' +
        '  Fs.writeFileSync(Path.join("..", f), t)\n' +
        '}\n');
    write('.sdk/package.json', JSON.stringify({
        name: 'check-drift-fixture', private: true,
        scripts: { generate: 'node generate.js' },
    }));
    write('.gitignore', 'node_modules/\n');
    write('node_modules/dep/index.js', 'ignored, not output\n');
    for (const [file, text] of Object.entries(tree))
        write(file, text);
    const git = (...args) => node_child_process_1.default.execFileSync('git', ['-c', 'user.email=test@example.com', '-c', 'user.name=test', ...args], { cwd: dir, stdio: 'pipe' });
    git('init', '-q');
    git('add', '-A');
    git('commit', '-q', '-m', 'fixture');
    const run = node_child_process_1.default.spawnSync('bash', [node_path_1.default.join(dir, '.sdk/admin/check-drift.sh')], { cwd: dir, encoding: 'utf8' });
    return { dir, status: run.status, out: run.stdout + run.stderr };
}
(0, node_test_1.describe)('check-drift', {
    skip: 'win32' === process.platform && 'the admin scripts are bash',
}, () => {
    (0, node_test_1.test)('a stale file in a target folder is reported', () => {
        const p = project({ ts: { name: 'ts' } }, { 'ts/a.ts': 'a\n', 'ts/stale.ts': 'old\n' }, { 'ts/a.ts': 'a\n' });
        (0, node_assert_1.equal)(p.status, 1, p.out);
        (0, node_assert_1.match)(p.out, /D ts\/stale\.ts/);
    });
    (0, node_test_1.test)('a stale file of a target generated at the root is reported', () => {
        const tree = {
            '.gitignore': 'node_modules/\n', 'README.md': 'r\n',
            'src/a.ts': 'a\n', 'src/stale.ts': 'old\n',
        };
        const p = project({ p: { name: 'p', output: { root: true } } }, tree, { '.gitignore': 'node_modules/\n', 'README.md': 'r\n', 'src/a.ts': 'a\n' });
        (0, node_assert_1.equal)(p.status, 1, p.out);
        (0, node_assert_1.match)(p.out, /D src\/stale\.ts/);
        (0, node_assert_1.ok)(!/\.sdk\//.test(p.out.split('DRIFT')[1] || ''), p.out);
        (0, node_assert_1.ok)(node_fs_1.default.existsSync(node_path_1.default.join(p.dir, 'node_modules/dep/index.js')));
    });
    (0, node_test_1.test)('a target generated at the root, reproduced exactly, is clean', () => {
        const emit = { '.gitignore': 'node_modules/\n', 'README.md': 'r\n', 'src/a.ts': 'a\n' };
        const p = project({ p: { name: 'p', output: { root: true } } }, emit, emit);
        (0, node_assert_1.equal)(p.status, 0, p.out);
        (0, node_assert_1.match)(p.out, /check-drift: clean/);
    });
});
//# sourceMappingURL=checkdrift.test.js.map
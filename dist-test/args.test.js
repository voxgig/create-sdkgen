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
const create_sdkgen_1 = require("../dist/create-sdkgen");
const BIN = node_path_1.default.resolve(__dirname, '..', 'bin', 'create-sdkgen');
const made = [];
(0, node_test_1.after)(() => made.forEach((dir) => node_fs_1.default.rmSync(dir, { recursive: true, force: true })));
// The environment the CLI sees, less anything npm put there for this run.
function cleanEnv(over = {}) {
    const env = { ...process.env };
    for (const key of Object.keys(env).filter((key) => key.startsWith('npm_config_'))) {
        delete env[key];
    }
    return { ...env, ...over };
}
function runBin(args, env = {}) {
    const cwd = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'csdk-args-'));
    made.push(cwd);
    const run = node_child_process_1.default.spawnSync(process.execPath, [BIN, ...args], { cwd, env: cleanEnv(env), encoding: 'utf8' });
    return { cwd, status: run.status, out: run.stdout + run.stderr };
}
(0, node_test_1.describe)('npm-create-forwarding', () => {
    (0, node_test_1.test)('target names pass, alone or comma-joined', () => {
        (0, node_assert_1.equal)((0, create_sdkgen_1.forwardingError)('foo', ['ts', 'py,go', 'py-data'], {}), undefined);
        (0, node_assert_1.equal)((0, create_sdkgen_1.forwardingError)('foo', [], {}), undefined);
    });
    (0, node_test_1.test)('a value npm passed on without its flag is refused, with the -- form', () => {
        const msg = (0, create_sdkgen_1.forwardingError)('foo', ['./openapi.yaml', './out', 'ts'], {});
        (0, node_assert_1.ok)(msg);
        (0, node_assert_1.match)(msg, /Not a target: \.\/openapi\.yaml, \.\/out\./);
        (0, node_assert_1.match)(msg, /npm create @voxgig\/sdkgen@latest foo -- -d \.\/openapi\.yaml -t ts/);
    });
    (0, node_test_1.test)('a flag npm kept for itself is refused, so a dry run cannot run for real', () => {
        (0, node_assert_1.match)((0, create_sdkgen_1.forwardingError)('foo', [], { npm_config_dryrun: 'true' }) || '', /npm kept --dryrun for itself/);
        (0, node_assert_1.match)((0, create_sdkgen_1.forwardingError)('foo', [], { npm_config_install: '' }) || '', /npm kept --no-install for itself/);
    });
    (0, node_test_1.test)('the target list names each language target once', () => {
        (0, node_assert_1.deepEqual)([...new Set(create_sdkgen_1.TARGETS)].sort(), [...create_sdkgen_1.TARGETS].sort());
        for (const target of ['ts', 'py-data', 'go-mcp', 'lean']) {
            (0, node_assert_1.ok)(create_sdkgen_1.TARGETS.includes(target), target);
        }
    });
    (0, node_test_1.test)('the CLI refuses a spec path where a target goes, and writes nothing', () => {
        const run = runBin(['petstore', './openapi.yaml', '--no-install', '--dryrun']);
        (0, node_assert_1.equal)(run.status, 1, run.out);
        (0, node_assert_1.match)(run.out, /Not a target: \.\/openapi\.yaml\./);
        (0, node_assert_1.match)(run.out, / -- -d \.\/openapi\.yaml -t ts/);
        (0, node_assert_1.deepEqual)(node_fs_1.default.readdirSync(run.cwd), []);
    });
    (0, node_test_1.test)('the CLI refuses a run npm stripped --dryrun from', () => {
        const run = runBin(['petstore', '--no-install'], { npm_config_dryrun: 'true' });
        (0, node_assert_1.equal)(run.status, 1, run.out);
        (0, node_assert_1.match)(run.out, /npm kept --dryrun for itself/);
        (0, node_assert_1.deepEqual)(node_fs_1.default.readdirSync(run.cwd), []);
    });
    (0, node_test_1.test)('help names the -- separator', () => {
        const run = runBin(['--help']);
        (0, node_assert_1.equal)(run.status, 0, run.out);
        (0, node_assert_1.match)(run.out, /npm create @voxgig\/sdkgen@latest <name> -- <args>/);
    });
});
//# sourceMappingURL=args.test.js.map
"use strict";
/* Copyright (c) 2026 Richard Rodger, MIT License */
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
const scaffold_record_1 = require("../dist/scaffold-record");
const TMP_ROOT = Fs.mkdtempSync(node_path_1.default.join(Os.tmpdir(), 'csdk-merge-'));
const DEF_CONTENT = 'openapi: 3.0.0\ninfo:\n  title: Pet Store\n  version: 1.0.0\npaths: {}\n';
const ROOT_TS = '.sdk/src/Root.ts';
(0, node_test_1.after)(() => {
    Fs.rmSync(TMP_ROOT, { recursive: true, force: true });
});
async function project() {
    const work = Fs.mkdtempSync(node_path_1.default.join(TMP_ROOT, 'p-'));
    const out = node_path_1.default.join(work, 'out');
    const def = node_path_1.default.join(work, 'petstore.yml');
    Fs.writeFileSync(def, DEF_CONTENT);
    const create = (over = {}) => (0, __1.CreateSdkGen)({ debug: 'warn' }).generate({
        root: 'CreateRoot', name: 'petstore', def,
        project: 'standard', folder: out, install: false, ...over,
    });
    await create();
    const path = (rel) => node_path_1.default.join(out, ...rel.split('/'));
    const read = (rel) => Fs.readFileSync(path(rel), 'utf8');
    const write = (rel, text) => {
        Fs.mkdirSync(node_path_1.default.dirname(path(rel)), { recursive: true });
        Fs.writeFileSync(path(rel), text);
    };
    // What an older scaffold wrote: the current file with another first line,
    // recorded and kept as its base.
    const age = (rel) => {
        const current = read(rel);
        const older = ['// an older first line', ...current.split('\n').slice(1)].join('\n');
        write('.sdk/log/scaffold-base/' + rel, older);
        Fs.appendFileSync(path('.sdk/log/scaffold.jsonl'), JSON.stringify({ op: 'scaffold', files: { [rel]: (0, scaffold_record_1.fingerprint)(older) } }) + '\n');
        return { current, older };
    };
    return { out, create, path, read, write, age };
}
(0, node_test_1.describe)('re-scaffold merge', () => {
    (0, node_test_1.test)('a scaffold records what it wrote, and not the project overlay', async () => {
        const p = await project();
        const record = (0, scaffold_record_1.readScaffold)(Fs, p.out);
        node_assert_1.default.equal(record[ROOT_TS], (0, scaffold_record_1.fingerprint)(p.read(ROOT_TS)));
        node_assert_1.default.equal(record['.sdk/model/project.aontu'], undefined);
        node_assert_1.default.ok(!Object.keys(record).some((rel) => rel.startsWith('.sdk/def/')));
    });
    (0, node_test_1.test)('a local change to a scaffold file survives a re-scaffold', async () => {
        const p = await project();
        const edited = p.read(ROOT_TS) + '\n// a local change\n';
        p.write(ROOT_TS, edited);
        await p.create();
        node_assert_1.default.equal(p.read(ROOT_TS), edited);
    });
    (0, node_test_1.test)('a local change takes a newer scaffold in other lines', async () => {
        const p = await project();
        const { current, older } = p.age(ROOT_TS);
        p.write(ROOT_TS, older + '\n// a local change\n');
        await p.create();
        node_assert_1.default.equal(p.read(ROOT_TS), current + '\n// a local change\n');
        node_assert_1.default.equal(p.read('.sdk/log/scaffold-base/' + ROOT_TS), current);
    });
    (0, node_test_1.test)('a conflict changes nothing and leaves the incoming file to read', async () => {
        const p = await project();
        const { older } = p.age(ROOT_TS);
        const local = ['// a local first line', ...older.split('\n').slice(1)].join('\n');
        p.write(ROOT_TS, local);
        await node_assert_1.default.rejects(p.create(), /cannot take the incoming copy/);
        node_assert_1.default.equal(p.read(ROOT_TS), local);
        node_assert_1.default.match(p.read('.sdk/log/scaffold-conflict/' + ROOT_TS), /<<<<<<< INCOMING/);
        await p.create({ keep: true });
        node_assert_1.default.equal(p.read(ROOT_TS), local);
    });
    (0, node_test_1.test)('overwrite mode, and --force, take the incoming scaffold', async () => {
        const p = await project();
        const original = p.read(ROOT_TS);
        p.write(ROOT_TS, original + '\n// a local change\n');
        await p.create({ force: true });
        node_assert_1.default.equal(p.read(ROOT_TS), original);
        p.write('.sdk/model/project.aontu', p.read('.sdk/model/project.aontu') + "\nmain: kit: copies: 'overwrite'\n");
        p.write(ROOT_TS, original + '\n// a local change\n');
        await p.create();
        node_assert_1.default.equal(p.read(ROOT_TS), original);
    });
    (0, node_test_1.test)('a project scaffolded before the record cannot be merged', async () => {
        const p = await project();
        Fs.rmSync(p.path('.sdk/log/scaffold.jsonl'));
        const original = p.read(ROOT_TS);
        p.write(ROOT_TS, original + '\n// a local change\n');
        await node_assert_1.default.rejects(p.create(), /no record of what the toolchain wrote here/);
        await p.create({ force: true });
        node_assert_1.default.equal(p.read(ROOT_TS), original);
        node_assert_1.default.equal((0, scaffold_record_1.readScaffold)(Fs, p.out)[ROOT_TS], (0, scaffold_record_1.fingerprint)(original));
    });
});
//# sourceMappingURL=copymerge.test.js.map
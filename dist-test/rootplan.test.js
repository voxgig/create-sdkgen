"use strict";
/* Copyright (c) 2026 Richard Rodger, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_module_1 = __importDefault(require("node:module"));
const node_path_1 = __importDefault(require("node:path"));
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
const SRC = node_path_1.default.resolve(__dirname, '..', 'project', 'standard', '.sdk', 'src');
let rootPlan;
// The scaffold compiles only inside a generated project, so RootPlan.ts is
// loaded from source with its types stripped.
(0, node_test_1.before)(async () => {
    const source = node_fs_1.default.readFileSync(node_path_1.default.join(SRC, 'RootPlan.ts'), 'utf8');
    const js = node_module_1.default.stripTypeScriptTypes(source);
    const mod = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
    rootPlan = mod.rootPlan;
});
const targets = (...names) => Object.fromEntries(names.map((name) => [name, { name }]));
(0, node_test_1.describe)('root-plan', () => {
    (0, node_test_1.test)('every target in its own folder, and the repository files, by default', () => {
        (0, node_assert_1.deepEqual)(rootPlan({ target: targets('ts', 'go', 'py') }), {
            top: true,
            build: true,
            place: { go: 'folder', py: 'folder', ts: 'folder' },
        });
    });
    (0, node_test_1.test)('an inactive target is not generated', () => {
        const plan = rootPlan({
            target: { ...targets('go'), ts: { name: 'ts', active: false } },
        });
        (0, node_assert_1.deepEqual)(plan.place, { go: 'folder' });
    });
    (0, node_test_1.test)('the top and build phases switch off independently', () => {
        const top = rootPlan({ phase: { top: { active: false } }, target: {} });
        (0, node_assert_1.equal)(top.top, false);
        (0, node_assert_1.equal)(top.build, true);
        const build = rootPlan({ phase: { build: { active: false } }, target: {} });
        (0, node_assert_1.equal)(build.top, true);
        (0, node_assert_1.equal)(build.build, false);
    });
    (0, node_test_1.test)('a target can be generated at the project root', () => {
        const plan = rootPlan({
            phase: { top: { active: false }, build: { active: false } },
            target: {
                ts: { name: 'ts', active: false },
                'seneca-provider': { name: 'seneca-provider', output: { root: true } },
            },
        });
        (0, node_assert_1.deepEqual)(plan, {
            top: false,
            build: false,
            place: { 'seneca-provider': 'root' },
        });
    });
    (0, node_test_1.test)('only one target can take the project root', () => {
        (0, node_assert_1.throws)(() => rootPlan({
            phase: { top: { active: false } },
            target: {
                a: { name: 'a', output: { root: true } },
                b: { name: 'b', output: { root: true } },
            },
        }), /Only one target .* 2 declare `output: root: true`: a, b\./);
    });
    (0, node_test_1.test)('a root target needs the repository files switched off', () => {
        (0, node_assert_1.throws)(() => rootPlan({
            target: { p: { name: 'p', output: { root: true } } },
        }), /main: kit: phase: top: active: false/);
    });
    (0, node_test_1.test)('an inactive target does not claim the root', () => {
        const plan = rootPlan({
            phase: { top: { active: false } },
            target: {
                a: { name: 'a', output: { root: true } },
                b: { name: 'b', active: false, output: { root: true } },
            },
        });
        (0, node_assert_1.deepEqual)(plan.place, { a: 'root' });
    });
    (0, node_test_1.test)('a model without targets plans none', () => {
        (0, node_assert_1.deepEqual)(rootPlan({}), { top: true, build: true, place: {} });
        (0, node_assert_1.deepEqual)(rootPlan(undefined), { top: true, build: true, place: {} });
    });
    (0, node_test_1.test)('failures take the caller\'s error type', () => {
        class Refusal extends Error {
        }
        try {
            rootPlan({ target: { p: { name: 'p', output: { root: true } } } }, Refusal);
            (0, node_assert_1.ok)(false, 'expected a refusal');
        }
        catch (err) {
            (0, node_assert_1.ok)(err instanceof Refusal, 'not the caller\'s error type: ' + err);
        }
    });
    // A plan the standard Root does not consult would pass every test above.
    (0, node_test_1.test)('the standard Root renders through the plan', () => {
        const root = node_fs_1.default.readFileSync(node_path_1.default.join(SRC, 'Root.ts'), 'utf8');
        (0, node_assert_1.match)(root, /import \{ rootPlan \} from '\.\/RootPlan'/);
        (0, node_assert_1.match)(root, /rootPlan\(model\.main\[KIT\], SdkGenError\)/);
        (0, node_assert_1.match)(root, /if \(plan\.top\) \{\s*Top\(\{\}\)/);
        (0, node_assert_1.match)(root, /if \(plan\.build\) \{\s*BuildSDK\(\{\}\)/);
        (0, node_assert_1.match)(root, /plan\.place\[key\]/);
    });
});
//# sourceMappingURL=rootplan.test.js.map
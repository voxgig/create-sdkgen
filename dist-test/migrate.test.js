"use strict";
/* Copyright (c) 2026 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
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
//# sourceMappingURL=migrate.test.js.map
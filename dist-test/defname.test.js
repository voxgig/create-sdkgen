"use strict";
/* Copyright (c) 2024-2026 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
// The OpenAPI filename is inherited from the upstream API slug, and upstream
// slugs are NOT constrained to [a-z0-9-]. That name is both the file copied
// into .sdk/def/ and the value written into a single-quoted aontu string in
// sdk.aon:
//
//     def: 'catherine-shulman's-quotes_0.1.0.json'
//                              ^ terminates the string
//
// which fails to parse ("unexpected character(s): s") and produces no SDK at
// all. The freepublicapis corpus really does contain that slug, plus accents
// and '!' / '>' / '_', so this is a live case, not a hypothetical.
//
// The other half of the contract is that ALREADY-CONFORMING names must come
// through byte-identical: the sanitiser runs on every scaffold of every repo,
// so any gratuitous rewrite would rename the def file in hundreds of repos at
// once. Version segments therefore keep their '.' and '_'.
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
// Built module, not source: test/tsconfig.json sets rootDir to test/, so a
// direct ../src import fails to compile (TS6059), and the other suites import
// the built package the same way.
const CreateRoot_1 = require("../dist/project/standard/CreateRoot");
(0, node_test_1.describe)('defname', () => {
    (0, node_test_1.test)('leaves conforming names untouched', () => {
        // No churn: these are the shapes already on disk across the fleets.
        (0, node_assert_1.equal)((0, CreateRoot_1.sanitizeDefName)('aareguru_0.1.0.json'), 'aareguru_0.1.0.json');
        (0, node_assert_1.equal)((0, CreateRoot_1.sanitizeDefName)('gitlab-v4-swagger-2.0.yaml'), 'gitlab-v4-swagger-2.0.yaml');
        (0, node_assert_1.equal)((0, CreateRoot_1.sanitizeDefName)('u.to-link-shortener_0.1.0.json'), 'u.to-link-shortener_0.1.0.json');
        (0, node_assert_1.equal)((0, CreateRoot_1.sanitizeDefName)('inno_cyber-authentication_0.1.0.json'), 'inno_cyber-authentication_0.1.0.json');
    });
    (0, node_test_1.test)('elides quotes so the name agrees with sanitizeSlug', () => {
        // apidef's sanitizeSlug DROPS the apostrophe to derive the repo name
        // (catherine-shulmans-quotes-sdk); folding it to '-' here would leave the
        // def file and the repo disagreeing about the same slug.
        (0, node_assert_1.equal)((0, CreateRoot_1.sanitizeDefName)("catherine-shulman's-quotes_0.1.0.json"), 'catherine-shulmans-quotes_0.1.0.json');
    });
    (0, node_test_1.test)('folds accents to ascii', () => {
        (0, node_assert_1.equal)((0, CreateRoot_1.sanitizeDefName)('dólar-y-monedas_0.1.0.json'), 'dolar-y-monedas_0.1.0.json');
        (0, node_assert_1.equal)((0, CreateRoot_1.sanitizeDefName)('kölner-adressen_0.1.0.json'), 'kolner-adressen_0.1.0.json');
        (0, node_assert_1.equal)((0, CreateRoot_1.sanitizeDefName)('pokémon-tcg_0.1.0.json'), 'pokemon-tcg_0.1.0.json');
    });
    (0, node_test_1.test)('folds other punctuation without leaving separators dangling', () => {
        (0, node_assert_1.equal)((0, CreateRoot_1.sanitizeDefName)('osu!-beatmap_0.1.0.json'), 'osu-beatmap_0.1.0.json');
        (0, node_assert_1.equal)((0, CreateRoot_1.sanitizeDefName)('we->-ultrarich_0.1.0.yaml'), 'we-ultrarich_0.1.0.yaml');
        // '!' sits directly before the version separator: the fold must not leave
        // yu-gi-oh-_0.1.0.json.
        (0, node_assert_1.equal)((0, CreateRoot_1.sanitizeDefName)('yu-gi-oh!_0.1.0.json'), 'yu-gi-oh_0.1.0.json');
    });
    (0, node_test_1.test)('lowercases', () => {
        (0, node_assert_1.equal)((0, CreateRoot_1.sanitizeDefName)('UPPER-Case_0.1.0.JSON'), 'upper-case_0.1.0.json');
    });
    (0, node_test_1.test)('never emits a name outside [a-z0-9._-]', () => {
        const names = [
            "catherine-shulman's-quotes_0.1.0.json",
            'dólar-y-monedas_0.1.0.json',
            'we->-ultrarich_0.1.0.yaml',
            'yu-gi-oh!_0.1.0.json',
            'osu!-beatmap_0.1.0.json',
            'a b/c*d?e_0.1.0.json',
        ];
        for (const n of names) {
            (0, node_assert_1.equal)(/^[a-z0-9._-]+$/.test((0, CreateRoot_1.sanitizeDefName)(n)), true, n);
        }
    });
    (0, node_test_1.test)('falls back rather than returning an empty name', () => {
        // A name that is entirely non-conforming must not collapse to '', which
        // would emit a def file with no filename.
        (0, node_assert_1.equal)((0, CreateRoot_1.sanitizeDefName)('!!!'), 'openapi.yml');
    });
});
//# sourceMappingURL=defname.test.js.map
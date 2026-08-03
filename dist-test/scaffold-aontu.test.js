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
// Aontu comments are `#` only. The npm engine's jsonic parser also enables
// `//` and `/* */`, but @voxgig/model - the thing that actually compiles these
// files - switches those off so the TypeScript and Go engines reject the same
// sources. A scaffolded `//` line therefore parses fine here and blows up in
// the user's project on the very first `voxgig-model` run, which is how
// .model-config/model-config.aontu shipped with a commented-out `docgen`
// action written `// docgen: ...` while its neighbours used `#`.
//
// The obvious guard - compile every scaffolded model - is not available: the
// files carrying imports (`@"@voxgig/model/..."`, `@"@voxgig/apidef/..."`) are
// exactly the ones that need packages this repo does not depend on. So check
// the syntax textually instead. It costs nothing and catches the whole class.
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const Fs = __importStar(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const STANDARD = node_path_1.default.resolve(__dirname, '..', 'project', 'standard');
function aontuFiles(dir) {
    return Fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? aontuFiles(node_path_1.default.join(dir, e.name)) :
        e.name.endsWith('.aontu') ? [node_path_1.default.join(dir, e.name)] : []);
}
// Blank out quoted spans before looking for comment markers, so a `//` inside
// a string - a url, or the `comment: line: '//'` a target model legitimately
// declares for a C-family language - is not mistaken for a comment.
function unquoted(line) {
    return line.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '');
}
(0, node_test_1.describe)('scaffold-aontu-syntax', () => {
    const files = aontuFiles(STANDARD);
    // A miswired path would make the test vacuously pass.
    (0, node_test_1.test)('the scaffold has model files to check', () => {
        node_assert_1.default.ok(0 < files.length, `no .aontu files under ${STANDARD}`);
    });
    (0, node_test_1.test)('no scaffolded model uses a slash comment', () => {
        const bad = [];
        for (const file of files) {
            const rel = node_path_1.default.relative(STANDARD, file);
            Fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
                if (/(^|\s)(\/\/|\/\*)/.test(unquoted(line))) {
                    bad.push(`${rel}:${i + 1}: ${line.trim()}`);
                }
            });
        }
        node_assert_1.default.deepEqual(bad, [], 'aontu accepts `#` comments only - these lines would fail to parse ' +
            'in a scaffolded project:\n  ' + bad.join('\n  '));
    });
});
//# sourceMappingURL=scaffold-aontu.test.js.map
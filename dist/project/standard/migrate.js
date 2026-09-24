"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateToAontu = migrateToAontu;
exports.rewriteIncludes = rewriteIncludes;
exports.scaffoldFiles = scaffoldFiles;
const node_path_1 = __importDefault(require("node:path"));
const TREES = ['model', 'test'];
const LEGACY = '.aon';
const CURRENT = '.aontu';
const TOOLCHAIN_RE = /^@voxgig\//;
const APIDEF_WRITES_RE = /^model\/guide\/[^/]*base-guide\.aontu$/;
// Comments and strings are matched whole, so an include is only ever an `@`
// outside both: a `.aon` named in a comment or held as data is not rewritten.
const TOKEN_RE = /#[^\n]*|@([ \t]*)(["'`])([^"'`\n]*)\2|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/g;
function rewriteIncludes(src, rename) {
    return src.replace(TOKEN_RE, (token, space, quote, path) => null != quote && path.endsWith(LEGACY) && rename(path) ?
        '@' + space + quote + path.slice(0, -LEGACY.length) + CURRENT + quote : token);
}
function legacyIncludes(src) {
    return [...src.matchAll(TOKEN_RE)]
        .filter((m) => null != m[2] && m[3].endsWith(LEGACY))
        .map((m) => m[3]);
}
function modelFiles(fs, sdk, ext) {
    const found = [];
    const walk = (rel) => {
        let entries;
        try {
            entries = fs.readdirSync(node_path_1.default.join(sdk, rel), { withFileTypes: true });
        }
        catch (_err) {
            return;
        }
        for (const entry of entries) {
            const child = rel + '/' + entry.name;
            if (entry.isDirectory()) {
                walk(child);
            }
            else if (entry.isFile() && entry.name.endsWith(ext)) {
                found.push(child);
            }
        }
    };
    TREES.forEach(walk);
    return found.sort();
}
function scaffoldFiles(fs, templateSdk, kept) {
    const keep = new Set(kept);
    const written = modelFiles(fs, templateSdk, CURRENT)
        .map((rel) => rel.replace('.fragment.', '.'));
    return { kept: keep, replaced: new Set(written.filter((rel) => !keep.has(rel))) };
}
// A failed step must not fail the scaffold: the file keeps the name it had.
function attempt(step) {
    try {
        step();
    }
    catch (_err) {
    }
}
// Written beside the target and renamed over it, so a write that fails part
// way leaves the file it would have replaced whole.
function writeWhole(fs, path, data) {
    const tmp = path + '.migrating';
    try {
        fs.writeFileSync(tmp, data);
        fs.renameSync(tmp, path);
    }
    catch (err) {
        attempt(() => fs.unlinkSync(tmp));
        throw err;
    }
}
function migrateFile(fs, prev, next) {
    if (fs.existsSync(next) || !fs.existsSync(prev)) {
        return;
    }
    attempt(() => {
        writeWhole(fs, next, fs.readFileSync(prev));
        fs.unlinkSync(prev);
    });
}
function includeRenamer(fs, sdk, scaffold, from) {
    const dir = node_path_1.default.dirname(node_path_1.default.join(sdk, from));
    return (path) => {
        if (TOOLCHAIN_RE.test(path)) {
            return true;
        }
        if (path.startsWith('@')) {
            return false;
        }
        const twin = node_path_1.default.resolve(dir, path.slice(0, -LEGACY.length) + CURRENT);
        const rel = node_path_1.default.relative(sdk, twin).split(node_path_1.default.sep).join('/');
        return fs.existsSync(twin) || scaffold.kept.has(rel) || scaffold.replaced.has(rel) ||
            APIDEF_WRITES_RE.test(rel);
    };
}
// Renames first and rewrites after, so an include changes only once the file
// it names is on disk as .aontu.
function migrateToAontu(fs, sdk, scaffold, warn) {
    const legacy = modelFiles(fs, sdk, LEGACY);
    const twin = (rel) => rel.slice(0, -LEGACY.length) + CURRENT;
    const abs = (rel) => node_path_1.default.join(sdk, rel);
    for (const rel of legacy.filter((rel) => !scaffold.replaced.has(twin(rel)))) {
        migrateFile(fs, abs(rel), abs(twin(rel)));
    }
    const sources = modelFiles(fs, sdk, CURRENT).filter((rel) => !scaffold.replaced.has(rel));
    for (const rel of sources) {
        attempt(() => {
            const src = String(fs.readFileSync(abs(rel)));
            const out = rewriteIncludes(src, includeRenamer(fs, sdk, scaffold, rel));
            if (out !== src) {
                writeWhole(fs, abs(rel), out);
            }
        });
    }
    for (const rel of legacy.filter((rel) => scaffold.replaced.has(twin(rel)))) {
        attempt(() => fs.unlinkSync(abs(rel)));
    }
    for (const rel of modelFiles(fs, sdk, LEGACY)) {
        warn(rel, fs.existsSync(abs(twin(rel))) ?
            'left in place: ' + twin(rel) + ' exists, and is the file aontu reads' :
            'could not be migrated to ' + twin(rel));
    }
    for (const rel of sources) {
        attempt(() => {
            for (const path of legacyIncludes(String(fs.readFileSync(abs(rel))))) {
                warn(rel, 'includes ' + path + ', which aontu refuses: rename that file ' +
                    'to .aontu and update the include');
            }
        });
    }
}
//# sourceMappingURL=migrate.js.map
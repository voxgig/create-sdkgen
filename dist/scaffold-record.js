"use strict";
/* Copyright (c) 2026 Richard Rodger, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCAFFOLD_CONFLICT = exports.SCAFFOLD_BASE = exports.SCAFFOLD_LOG = void 0;
exports.fingerprint = fingerprint;
exports.scaffoldMode = scaffoldMode;
exports.readScaffold = readScaffold;
exports.recordScaffold = recordScaffold;
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = require("node:crypto");
const copymerge_1 = require("./copymerge");
// Relative to the project folder.
const SCAFFOLD_LOG = '.sdk/log/scaffold.jsonl';
exports.SCAFFOLD_LOG = SCAFFOLD_LOG;
const SCAFFOLD_BASE = '.sdk/log/scaffold-base';
exports.SCAFFOLD_BASE = SCAFFOLD_BASE;
const SCAFFOLD_CONFLICT = '.sdk/log/scaffold-conflict';
exports.SCAFFOLD_CONFLICT = SCAFFOLD_CONFLICT;
const PROJECT_MODEL = '.sdk/model/project.aontu';
const COPIES_RE = /^\s*main\s*:\s*kit\s*:\s*copies\s*:\s*['"]?(merge|overwrite)\b/m;
// As @voxgig/sdkgen fingerprints its copies: CRLF and LF read the same.
function fingerprint(content) {
    const bytes = Buffer.isBuffer(content) ? content : Buffer.from(String(content));
    const lf = Buffer.from(bytes.toString('latin1').replace(/\r\n/g, '\n'), 'latin1');
    return (0, node_crypto_1.createHash)('sha256').update(lf).digest('hex').slice(0, 16);
}
function at(folder, rel) {
    return node_path_1.default.join(folder, ...rel.split('/'));
}
// `main.kit.copies`, read from the project overlay without building the model.
function scaffoldMode(fs, folder) {
    const path = at(folder, PROJECT_MODEL);
    const text = fs.existsSync(path) ? String(fs.readFileSync(path, 'utf8')) : '';
    return (0, copymerge_1.copyMode)(COPIES_RE.exec(text)?.[1]);
}
// Replays the append-only log: each line holds what one scaffold changed.
function readScaffold(fs, folder) {
    const files = {};
    const path = at(folder, SCAFFOLD_LOG);
    if (!fs.existsSync(path)) {
        return files;
    }
    for (const line of String(fs.readFileSync(path, 'utf8')).split('\n')) {
        let entry;
        try {
            entry = '' === line.trim() ? undefined : JSON.parse(line);
        }
        catch (err) {
            continue;
        }
        for (const [rel, print] of Object.entries(entry?.files ?? {})) {
            if ('string' === typeof print) {
                files[rel] = print;
            }
            else if (null === print) {
                delete files[rel];
            }
        }
    }
    return files;
}
function recordScaffold(fs, folder, jres, version, manage, record) {
    const written = [
        ...(jres?.files?.written ?? []), ...(jres?.files?.unchanged ?? []),
    ];
    const files = {};
    for (const path of written) {
        const rel = node_path_1.default.relative(node_path_1.default.resolve(folder), node_path_1.default.resolve(path))
            .split(node_path_1.default.sep).join('/');
        if ('' === rel || rel.startsWith('../') || !manage(rel) || !fs.existsSync(path)) {
            continue;
        }
        const print = fingerprint(fs.readFileSync(path));
        if (print !== record[rel]) {
            files[rel] = print;
        }
    }
    if (0 === Object.keys(files).length) {
        return;
    }
    const sorted = Object.fromEntries(Object.keys(files).sort()
        .map((rel) => [rel, files[rel]]));
    const log = at(folder, SCAFFOLD_LOG);
    fs.mkdirSync(node_path_1.default.dirname(log), { recursive: true });
    fs.appendFileSync(log, JSON.stringify({
        at: new Date().toISOString(), op: 'scaffold', version, files: sorted,
    }) + '\n');
}
//# sourceMappingURL=scaffold-record.js.map
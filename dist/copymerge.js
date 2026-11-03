"use strict";
/* Copyright (c) 2026 Richard Rodger, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OVERWRITE = exports.MERGE = void 0;
exports.copyMode = copyMode;
exports.withCopyMerge = withCopyMerge;
exports.gitVersions = gitVersions;
exports.merge3 = merge3;
// The copy merge @voxgig/sdkgen runs on an add, applied to a re-scaffold.
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = require("node:fs");
const node_child_process_1 = require("node:child_process");
const jostraca_1 = require("jostraca");
const MERGE = 'merge';
exports.MERGE = MERGE;
const OVERWRITE = 'overwrite';
exports.OVERWRITE = OVERWRITE;
const DELETED = Symbol('deleted');
function copyMode(value) {
    return OVERWRITE === value ? OVERWRITE : MERGE;
}
async function withCopyMerge(spec, run) {
    if (MERGE !== spec.mode || true === spec.force || true === spec.dryrun) {
        const result = await run(spec.fs);
        if (true !== spec.dryrun) {
            clearConflicts(spec);
        }
        return result;
    }
    const guard = new CopyGuard(spec);
    let result;
    try {
        result = await run(guard.fs);
    }
    catch (err) {
        guard.rollback();
        throw err;
    }
    guard.finish();
    return result;
}
// The previews of a run that stopped are stale once a later run completes.
function clearConflicts(spec) {
    const dir = node_path_1.default.join(node_path_1.default.resolve(spec.folder), ...spec.conflictdir.split('/'));
    if (spec.fs.existsSync(dir)) {
        spec.fs.rmSync(dir, { recursive: true, force: true });
    }
}
class CopyGuard {
    constructor(spec) {
        this.orig = new Map();
        this.dirs = [];
        this.edited = new Map();
        this.pending = new Map();
        this.touched = new Set();
        this.spared = [];
        this.spec = spec;
        this.real = spec.fs;
        this.root = node_path_1.default.resolve(spec.folder);
        this.fs = this.wrap();
    }
    wrap() {
        const real = this.real;
        const gfs = {};
        for (const key in real) {
            const val = real[key];
            gfs[key] = 'function' === typeof val ? val.bind(real) : val;
        }
        gfs.writeFileSync = (path, data, opts) => {
            if (this.holds(path, toBuffer(data, opts))) {
                return;
            }
            this.before(path);
            return real.writeFileSync(path, data, opts);
        };
        gfs.appendFileSync = (path, data, opts) => {
            this.before(path);
            return real.appendFileSync(path, data, opts);
        };
        gfs.copyFileSync = (from, to, mode) => {
            if (this.holds(to, Buffer.from(real.readFileSync(from)))) {
                return;
            }
            this.before(to);
            return real.copyFileSync(from, to, mode);
        };
        gfs.renameSync = (from, to) => {
            const data = this.isFile(from) ? this.read(from) : undefined;
            if (null != data && this.holds(to, data)) {
                this.before(from);
                real.unlinkSync(from);
                return;
            }
            this.before(from);
            this.before(to);
            return real.renameSync(from, to);
        };
        gfs.unlinkSync = (path) => {
            if (this.spares(path)) {
                return;
            }
            this.before(path);
            return real.unlinkSync(path);
        };
        gfs.mkdirSync = (path, opts) => {
            const missing = this.missingDirs(path);
            const res = real.mkdirSync(path, opts);
            this.dirs.push(...missing.filter((dir) => real.existsSync(dir)));
            return res;
        };
        gfs.readFileSync = (path, opts) => {
            const held = 'string' === typeof path ?
                this.pending.get(node_path_1.default.resolve(path)) : undefined;
            if (held instanceof Buffer) {
                const encoding = 'string' === typeof opts ? opts : opts?.encoding;
                return null == encoding ? Buffer.from(held) : held.toString(encoding);
            }
            return real.readFileSync(path, opts);
        };
        return gfs;
    }
    rel(path) {
        if ('string' !== typeof path) {
            return undefined;
        }
        const rel = node_path_1.default.relative(this.root, node_path_1.default.resolve(path)).split(node_path_1.default.sep).join('/');
        return ('' === rel || '..' === rel || rel.startsWith('../') || node_path_1.default.isAbsolute(rel)) ?
            undefined : rel;
    }
    managed(rel) {
        return null != rel &&
            !within(rel, this.spec.basedir) && !within(rel, this.spec.conflictdir) &&
            this.spec.manage(rel);
    }
    isFile(path) {
        try {
            return true === this.real.statSync(path)?.isFile();
        }
        catch (err) {
            return false;
        }
    }
    read(path) {
        return Buffer.from(this.real.readFileSync(path));
    }
    createdHere(abs) {
        return this.orig.has(abs) && null === this.orig.get(abs);
    }
    before(path) {
        if ('string' !== typeof path) {
            return;
        }
        const abs = node_path_1.default.resolve(path);
        if (!this.orig.has(abs)) {
            if (this.isFile(abs)) {
                this.orig.set(abs, this.read(abs));
            }
            else if (!this.real.existsSync(abs)) {
                this.orig.set(abs, null);
            }
        }
        const rel = this.rel(abs);
        if (this.managed(rel)) {
            this.touched.add(rel);
        }
    }
    // Was this file changed after the toolchain wrote it? Asked once, before
    // the run writes it; a file the record does not hold counts as changed.
    isEdited(rel, abs) {
        let edited = this.edited.get(rel);
        if (null == edited) {
            const print = this.spec.recorded(rel);
            edited = null == print || print !== this.spec.fingerprint(this.read(abs));
            this.edited.set(rel, edited);
        }
        return edited;
    }
    // Defers a write over a locally changed file, leaving it on disk as it is.
    holds(path, data) {
        if ('string' !== typeof path) {
            return false;
        }
        const abs = node_path_1.default.resolve(path);
        const rel = this.rel(abs);
        if (!this.managed(rel)) {
            return false;
        }
        if (this.pending.has(abs)) {
            this.pending.set(abs, data);
            return true;
        }
        if (this.createdHere(abs) || !this.isFile(abs) || !this.isEdited(rel, abs)) {
            return false;
        }
        if (sameText(this.read(abs), data)) {
            return false;
        }
        this.pending.set(abs, data);
        return true;
    }
    // A delete of a changed file, or of one no add wrote, leaves it in place.
    spares(path) {
        if ('string' !== typeof path) {
            return false;
        }
        const abs = node_path_1.default.resolve(path);
        const rel = this.rel(abs);
        if (!this.managed(rel) || this.createdHere(abs) || !this.isFile(abs)) {
            return false;
        }
        if (null == this.spec.recorded(rel)) {
            this.spared.push(rel);
            return true;
        }
        if (this.pending.has(abs) || this.isEdited(rel, abs)) {
            this.pending.set(abs, DELETED);
            return true;
        }
        return false;
    }
    missingDirs(path) {
        if ('string' !== typeof path) {
            return [];
        }
        const missing = [];
        let dir = node_path_1.default.resolve(path);
        while (!this.real.existsSync(dir) && node_path_1.default.dirname(dir) !== dir) {
            missing.push(dir);
            dir = node_path_1.default.dirname(dir);
        }
        return missing;
    }
    // An incoming copy the record already holds is its own base: the source
    // did not move since the add that wrote it.
    base(rel, incoming) {
        const print = this.spec.recorded(rel);
        if (null == print) {
            return undefined;
        }
        if (print === this.spec.fingerprint(incoming)) {
            return incoming;
        }
        const stored = this.storePath(this.spec.basedir, rel);
        if (this.isFile(stored)) {
            const base = this.read(stored);
            if (print === this.spec.fingerprint(base)) {
                return base;
            }
        }
        for (const version of this.spec.versions?.(node_path_1.default.join(this.root, rel)) ?? []) {
            if (print === this.spec.fingerprint(version)) {
                return version;
            }
        }
        return undefined;
    }
    storePath(dir, rel) {
        return node_path_1.default.join(this.root, ...dir.split('/'), ...rel.split('/'));
    }
    finish() {
        const outcome = { merged: [], kept: [], retained: [], spared: this.spared };
        const conflicts = [];
        const writes = [];
        const bases = new Map();
        for (const [abs, incoming] of this.pending) {
            const rel = this.rel(abs);
            if (DELETED === incoming) {
                outcome.retained.push(rel);
                continue;
            }
            const local = this.read(abs);
            const base = this.base(rel, incoming);
            let conflict;
            let merged;
            if (null == base) {
                conflict = { rel, why: 'nobase', preview: incoming };
            }
            else if (isBinary(incoming) || isBinary(local) || isBinary(base)) {
                conflict = { rel, why: 'binary', preview: incoming };
            }
            else {
                const res = merge3(incoming, base, local, this.spec.what);
                if (res.conflict) {
                    conflict = { rel, why: 'conflict', preview: res.content };
                }
                else {
                    merged = res.content;
                }
            }
            if (null != conflict && true === this.spec.keep) {
                outcome.kept.push(rel);
                bases.set(rel, incoming);
            }
            else if (null != conflict) {
                conflicts.push(conflict);
            }
            else {
                writes.push([abs, merged]);
                outcome.merged.push(rel);
                bases.set(rel, incoming);
            }
        }
        if (0 < conflicts.length) {
            this.rollback();
            this.previews(conflicts);
            throw this.failure(conflicts);
        }
        for (const [abs, content] of writes) {
            if (!sameText(this.read(abs), content)) {
                this.writeAtomic(abs, content);
            }
        }
        this.keepBases(bases);
        clearConflicts(this.spec);
        this.report(outcome);
        return outcome;
    }
    // The store holds a base only where the file differs from it: elsewhere
    // the file itself, checked against the record, is the base.
    keepBases(bases) {
        for (const rel of new Set([...this.touched, ...bases.keys()])) {
            const at = this.storePath(this.spec.basedir, rel);
            const base = bases.get(rel);
            if (null != base) {
                this.real.mkdirSync(node_path_1.default.dirname(at), { recursive: true });
                this.real.writeFileSync(at, base);
            }
            else if (this.isFile(at)) {
                this.real.unlinkSync(at);
            }
        }
    }
    rollback() {
        for (const [abs, content] of Array.from(this.orig).reverse()) {
            try {
                if (null != content) {
                    this.real.writeFileSync(abs, content);
                }
                else if (this.isFile(abs)) {
                    this.real.unlinkSync(abs);
                }
            }
            catch (err) {
                this.spec.log.warn({
                    point: 'copy-merge-rollback', file: abs, err: err?.message,
                    note: 'could not restore ' + abs + ': ' + err?.message,
                });
            }
        }
        for (const dir of [...this.dirs].reverse()) {
            try {
                if (0 === this.real.readdirSync(dir).length) {
                    this.real.rmdirSync(dir);
                }
            }
            catch (err) {
                continue;
            }
        }
    }
    previews(conflicts) {
        clearConflicts(this.spec);
        const dir = this.storePath(this.spec.conflictdir, '');
        this.real.mkdirSync(dir, { recursive: true });
        this.real.writeFileSync(node_path_1.default.join(dir, '.gitignore'), '*\n');
        for (const conflict of conflicts) {
            const at = this.storePath(this.spec.conflictdir, conflict.rel);
            this.real.mkdirSync(node_path_1.default.dirname(at), { recursive: true });
            this.real.writeFileSync(at, conflict.preview ?? Buffer.alloc(0));
        }
    }
    writeAtomic(abs, content) {
        const tmp = abs + '.copymerge-' + process.pid + '-' + Date.now();
        this.real.writeFileSync(tmp, content);
        this.real.renameSync(tmp, abs);
    }
    failure(conflicts) {
        const why = {
            conflict: 'the incoming copy and the local change touch the same lines',
            nobase: 'no record of what the toolchain wrote here, so nothing to merge ' +
                'against; a base is found in git once the copies an add writes are committed',
            binary: 'a binary file, which is never merged',
        };
        const shown = this.spec.conflictdir;
        const msg = this.spec.what + ': ' + conflicts.length +
            ' locally changed file(s) cannot take the incoming copy, so nothing was changed:\n  ' +
            conflicts.map((c) => c.rel + ' (' + why[c.why] + ')').join('\n  ') +
            '\n\n  The incoming copies are in ' + shown + '/, with conflict markers where ' +
            'both sides changed the same lines. Then either:' +
            '\n    - fold the incoming change into the local file by hand and re-run with ' +
            '--keep, which keeps the local files and records the incoming copies as ' +
            'their base;' +
            '\n    - or re-run with --force, which takes the incoming copies and discards ' +
            'the local changes.';
        return null == this.spec.error ? new Error(msg) : this.spec.error(msg);
    }
    report(outcome) {
        const log = this.spec.log;
        if (0 < outcome.merged.length) {
            log.info({
                point: 'copy-merge-merged', files: outcome.merged,
                note: this.spec.what + ': merged the incoming copy into ' +
                    outcome.merged.length + ' locally changed file(s): ' + outcome.merged.join(', ')
            });
        }
        if (0 < outcome.kept.length) {
            log.warn({
                point: 'copy-merge-kept', files: outcome.kept,
                note: this.spec.what + ': --keep, kept ' + outcome.kept.length +
                    ' local file(s) as they are: ' + outcome.kept.join(', ')
            });
        }
        if (0 < outcome.retained.length) {
            log.warn({
                point: 'copy-merge-retained', files: outcome.retained,
                note: this.spec.what + ': the source no longer provides ' +
                    outcome.retained.length + ' locally changed file(s), left in place: ' +
                    outcome.retained.join(', ')
            });
        }
        if (0 < outcome.spared.length) {
            log.info({
                point: 'copy-merge-spared', files: outcome.spared,
                note: this.spec.what + ': left ' + outcome.spared.length +
                    ' file(s) no add wrote in place: ' + outcome.spared.join(', ')
            });
        }
    }
}
function merge3(incoming, base, local, what) {
    const text = (bytes) => bytes.toString('latin1').replace(/\r\n/g, '\n');
    const res = jostraca_1.DiffUtil.merge(text(incoming), text(base), text(local), {
        labels: { generated: 'INCOMING (' + what + ')', existing: 'LOCAL' },
    });
    return {
        conflict: true === res.conflict || 'unresolved' === res.outcome,
        content: Buffer.from(res.content, 'latin1'),
    };
}
function within(rel, dir) {
    return rel === dir || rel.startsWith(dir + '/');
}
function toBuffer(data, opts) {
    if (Buffer.isBuffer(data)) {
        return data;
    }
    if (ArrayBuffer.isView(data)) {
        return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    }
    const encoding = ('string' === typeof opts ? opts : opts?.encoding) || 'utf8';
    return Buffer.from(String(data), encoding);
}
function sameText(a, b) {
    return a.toString('latin1').replace(/\r\n/g, '\n') ===
        b.toString('latin1').replace(/\r\n/g, '\n');
}
function isBinary(bytes) {
    return 0 <= bytes.subarray(0, 8000).indexOf(0);
}
// Committed versions of a file, newest first: the index, HEAD, then the
// commits that touched it. Nothing outside a git checkout.
function gitVersions(abs, limit = 20) {
    return {
        *[Symbol.iterator]() {
            let top;
            let rel;
            try {
                const dir = node_path_1.default.dirname(abs);
                top = git(dir, ['rev-parse', '--show-toplevel']).toString().trim();
                const real = node_path_1.default.join((0, node_fs_1.realpathSync)(dir), node_path_1.default.basename(abs));
                rel = node_path_1.default.relative(top, real).split(node_path_1.default.sep).join('/');
            }
            catch (err) {
                return;
            }
            const shown = (spec) => {
                try {
                    return git(top, ['show', spec]);
                }
                catch (err) {
                    return undefined;
                }
            };
            for (const spec of [':' + rel, 'HEAD:' + rel]) {
                const version = shown(spec);
                if (null != version) {
                    yield version;
                }
            }
            let shas = [];
            try {
                shas = git(top, ['log', '--format=%H', '-n', String(limit), '--', rel])
                    .toString().split('\n').filter(Boolean);
            }
            catch (err) {
                return;
            }
            for (const sha of shas) {
                const version = shown(sha + ':' + rel);
                if (null != version) {
                    yield version;
                }
            }
        }
    };
}
function git(cwd, args) {
    return (0, node_child_process_1.execFileSync)('git', args, {
        cwd, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 256 * 1024 * 1024,
    });
}
//# sourceMappingURL=copymerge.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRoot = void 0;
exports.sanitizeDefName = sanitizeDefName;
const node_path_1 = __importDefault(require("node:path"));
const jostraca_1 = require("jostraca");
const ModelSdk_1 = require("./ModelSdk");
const GITIGNORE_TOP = `# Local config / secrets
*.local.*
*.local

# Dependencies (no trailing slash: also ignores node_modules SYMLINKS, e.g.
# ts/node_modules -> shared tree, which a dir-only rule leaves tracked)
node_modules

# Logs
*.log
logs/

# OS
.DS_Store

# Editor
*~
*.swp
`;
const GITIGNORE_SDK = `# Local config / secrets
*.local.*
*.local

# Dependencies (no trailing slash: also ignores node_modules SYMLINKS, e.g.
# .sdk/node_modules -> shared tree, which a dir-only rule leaves tracked)
node_modules

# Build output
dist/
dist-test/
*.tsbuildinfo

# Generated logs
log/
*.log

# OS
.DS_Store
`;
const PROJECT_FILE = 'project.aon';
const PROJECT_STUB = `# Project overlay — YOURS. The scaffold creates this file once and never
# overwrites it, unlike every other file it writes.
#
# Everything else under model/ is toolchain-derived and is deliberately
# regenerated so that toolchain fixes propagate. Put anything here that is a
# decision about THIS project rather than a fact about the API.
#
# Included LAST by sdk.aon, after target/target-index.aon, because a key
# under main.kit.target.<t> can only refine a target that has already been
# defined. Declared earlier, the model build fails with "Cannot unify value:
# nil with value: string / key ext value was: nil", which names nothing that
# would lead you here.
#
# The release version each generated manifest declares (package.json,
# pyproject.toml, the gemspec, the rockspec) and that the port Makefiles tag:
#
#   main: kit: target: ts: publish: version: '1.2.3'
#
# Per target, because ports publish to different registries on different
# clocks. Set every target to the same value for a lockstep repo.
#
# A published package name that does not follow the derivation:
#
#   main: kit: target: ts: publish: registry: package: '@scope/name'
`;
const GUIDE_FILE = 'guide.aon';
const GUIDE_REL = ['model', 'guide', GUIDE_FILE];
function migrateOverlay(fs, dir, name) {
    const next = node_path_1.default.join(dir, name + '.aon');
    const prev = node_path_1.default.join(dir, name + '.aontu');
    if (fs.existsSync(next) || !fs.existsSync(prev)) {
        return;
    }
    try {
        const src = String(fs.readFileSync(prev))
            .replace(/(@['"][^'"]+)\.aontu(['"])/g, '$1.aon$2');
        fs.writeFileSync(next, src);
        fs.unlinkSync(prev);
    }
    catch (_err) {
        // A failed migration must not fail the scaffold: the worst case is the
        // template being written fresh, which is what would have happened anyway.
    }
}
function mergeGuide(existing, template) {
    if (null == existing) {
        return template;
    }
    const isInclude = (line) => line.trim().startsWith('@');
    const key = (line) => line.trim().replace(/^@"\.\//, '@"');
    const have = new Set(existing.split('\n').map(key));
    const missing = template.split('\n')
        .filter(isInclude)
        .map((line) => line.trim())
        .filter((line) => !have.has(key(line)));
    if (0 === missing.length) {
        return existing;
    }
    return missing.join('\n') + '\n\n' + existing;
}
function sanitizeDefName(filename) {
    const clean = filename
        .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/['’"]/g, '')
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        // yu-gi-oh!_0.1.0.json would otherwise keep the '!' as a dangling '-'
        // before the version separator: yu-gi-oh-_0.1.0.json.
        .replace(/-+([._])/g, '$1')
        .replace(/([._])-+/g, '$1')
        .replace(/^-|-$/g, '');
    return '' === clean ? 'openapi.yml' : clean;
}
const CreateRoot = (0, jostraca_1.cmp)(function CreateRoot(props) {
    const { ctx$, ctx$: { folder }, spec, model } = props;
    const fs = ctx$.fs();
    model.const = { name: model.name };
    (0, jostraca_1.names)(model.const, model.name);
    model.const.year = new Date().getFullYear();
    model.const.License = 'MIT';
    ctx$.model = model;
    (0, jostraca_1.Project)({ folder }, () => {
        const from = node_path_1.default.resolve(node_path_1.default.join(__dirname, '..', '..', '..', 'project', 'standard'));
        const guideExclude = [spec.sdk_folder, ...GUIDE_REL].join('/');
        (0, jostraca_1.Copy)({
            from,
            exclude: [/\.fragment\./, guideExclude, /^\.sdk\/admin\/.*\.sh$/]
        });
        (0, jostraca_1.File)({ name: '.gitignore' }, () => {
            (0, jostraca_1.Content)(GITIGNORE_TOP);
        });
        const origdef = spec.def;
        const projdef = sanitizeDefName(node_path_1.default.basename(origdef));
        spec.def = projdef;
        (0, jostraca_1.Folder)({ name: spec.sdk_folder }, () => {
            (0, jostraca_1.Folder)({ name: 'admin' }, () => {
                const admin = node_path_1.default.join(from, spec.sdk_folder, 'admin');
                for (const name of fs.readdirSync(admin).filter((name) => name.endsWith('.sh')).sort()) {
                    (0, jostraca_1.File)({ name, mode: 0o755 }, () => (0, jostraca_1.Content)(fs.readFileSync(node_path_1.default.join(admin, name), 'utf8')));
                }
            });
            (0, jostraca_1.File)({ name: '.gitignore' }, () => {
                (0, jostraca_1.Content)(GITIGNORE_SDK);
            });
            (0, jostraca_1.Folder)({ name: 'def' }, () => {
                if (fs.existsSync(origdef)) {
                    (0, jostraca_1.Copy)({ from: origdef, to: projdef });
                }
                else {
                    (0, jostraca_1.File)({ name: projdef }, () => {
                        (0, jostraca_1.Content)('# OpenAPI Definition');
                    });
                }
            });
            (0, jostraca_1.Folder)({ name: 'model' }, () => {
                (0, ModelSdk_1.ModelSdk)({ spec });
                // The project overlay, created once. An existing one is re-emitted
                // unchanged rather than skipped, so the write is a no-op instead of a
                // special case in the component tree.
                const projectPath = node_path_1.default.join(folder, spec.sdk_folder, 'model', PROJECT_FILE);
                // Same hazard, worse symptom: this file carries the release version,
                // so an ignored project.aontu silently resets every generated manifest
                // to the sdkgen default 0.0.1 — the exact bug fixed earlier this week.
                migrateOverlay(fs, node_path_1.default.dirname(projectPath), 'project');
                const existingProject = fs.existsSync(projectPath) ? fs.readFileSync(projectPath, 'utf8') : null;
                (0, jostraca_1.File)({ name: PROJECT_FILE }, () => {
                    (0, jostraca_1.Content)(null == existingProject ? PROJECT_STUB : existingProject);
                });
                // Re-emit the guide the Copy skipped, merged over whatever is already
                // there. On a fresh scaffold there is no existing file and this writes
                // the template unchanged; on a re-scaffold the user's overlay survives.
                (0, jostraca_1.Folder)({ name: 'guide' }, () => {
                    const guideTemplate = fs.readFileSync(node_path_1.default.join(from, spec.sdk_folder, ...GUIDE_REL), 'utf8');
                    const guidePath = node_path_1.default.join(folder, spec.sdk_folder, ...GUIDE_REL);
                    // Before the merge looks for it — otherwise a project whose guide is
                    // still named .aontu reads as having no overlay at all.
                    migrateOverlay(fs, node_path_1.default.dirname(guidePath), 'guide');
                    const existingGuide = fs.existsSync(guidePath) ? fs.readFileSync(guidePath, 'utf8') : null;
                    (0, jostraca_1.File)({ name: GUIDE_FILE }, () => {
                        (0, jostraca_1.Content)(mergeGuide(existingGuide, guideTemplate));
                    });
                });
            });
        });
    });
});
exports.CreateRoot = CreateRoot;
//# sourceMappingURL=CreateRoot.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRoot = void 0;
exports.sanitizeDefName = sanitizeDefName;
const node_path_1 = __importDefault(require("node:path"));
// import * as Fs from 'node:fs'
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
// The guide overlay is the ONE model file the user owns.
//
// Everything else the scaffold writes is toolchain-derived and is deliberately
// OVERWRITTEN (see the `existing.txt.write` rationale in create-sdkgen.ts) so a
// toolchain fix propagates. `model/guide/guide.aontu` is the exception: apidef
// unifies it OVER the heuristic classification, and it is where every
// documented customization lives — entity rename, hide, move, activate,
// per-path deactivation, method override, param rename, response transform.
// Copying the stub over it destroyed that work on every re-scaffold, and
// cedar-regen.sh re-scaffolds on every regen, so the loss was silent and
// repeated.
//
// It is excluded from the bulk Copy and merged instead (see mergeGuide).
const GUIDE_FILE = 'guide.aontu';
const GUIDE_REL = ['model', 'guide', GUIDE_FILE];
// Merge the guide template into an existing guide overlay.
//
// A guide is the template's `@`-includes plus whatever the user added. The
// includes are the only part the template OWNS, so the merge is: keep the
// user's file verbatim, and restore any include it is missing. When nothing
// is missing — the normal case — the file is returned byte-identical, so a
// re-scaffold is a no-op on it.
//
// Missing includes are restored at the TOP, not appended: `base-guide.aontu`
// carries the heuristic classification that the user's overrides unify over,
// and the overlay reads correctly only when the includes precede it.
function mergeGuide(existing, template) {
    if (null == existing) {
        return template;
    }
    const isInclude = (line) => line.trim().startsWith('@');
    const have = new Set(existing.split('\n').map((line) => line.trim()));
    const missing = template.split('\n')
        .filter(isInclude)
        .map((line) => line.trim())
        .filter((line) => !have.has(line));
    if (0 === missing.length) {
        return existing;
    }
    return missing.join('\n') + '\n\n' + existing;
}
// The OpenAPI filename is inherited from the upstream API slug, and upstream
// slugs are not constrained: the freepublicapis corpus contains apostrophes
// (catherine-shulman's-quotes), accents (dólar-y-monedas, kölner-adressen),
// and '!' / '>' / '_'. That name is copied into .sdk/def/ AND written verbatim
// into a single-quoted aontu string in sdk.aontu:
//
//     def: 'catherine-shulman's-quotes_0.1.0.json'
//                              ^ terminates the string -> AontuError, no SDK
//
// Slugs are [a-z0-9-]; a filename additionally needs '.' and '_' for the
// version segment and extension, so those are kept — which also means every
// already-conforming name (including cedar's dotted gitlab-v4-swagger-2.0.yaml)
// is untouched and no repo churns. Everything else is folded to '-'.
function sanitizeDefName(filename) {
    const clean = filename
        .normalize('NFKD').replace(/[\u0300-\u036f]/g, '') // dólar -> dolar
        .toLowerCase()
        // Quotes are ELIDED, not folded to '-', so the filename agrees with the
        // repo name apidef's sanitizeSlug derives from the same slug:
        // catherine-shulman's-quotes -> catherine-shulmans-quotes(-sdk).
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
// TODO: rename to RootSdk
const CreateRoot = (0, jostraca_1.cmp)(function CreateRoot(props) {
    const { ctx$, ctx$: { folder }, spec, model } = props;
    const fs = ctx$.fs();
    // TODO: move to @voxgig/util as duplicated
    model.const = { name: model.name };
    (0, jostraca_1.names)(model.const, model.name);
    model.const.year = new Date().getFullYear();
    // Scaffold is MIT-licensed (matches the emitted LICENSE and tm/LICENSE);
    // set directly rather than via names() so the value stays 'MIT', not 'Mit'.
    model.const.License = 'MIT';
    ctx$.model = model;
    (0, jostraca_1.Project)({ folder }, () => {
        const from = node_path_1.default.resolve(node_path_1.default.join(__dirname, '..', '..', '..', 'project', 'standard'));
        // console.log('FROM', from)
        // Copy `exclude` matches the SOURCE-RELATIVE path exactly, so this names
        // the one guide under the scaffold and nothing else. It is re-emitted,
        // merged, in the model folder below.
        const guideExclude = [spec.sdk_folder, ...GUIDE_REL].join('/');
        (0, jostraca_1.Copy)({
            from,
            exclude: [/\.fragment\./, guideExclude]
        });
        (0, jostraca_1.File)({ name: '.gitignore' }, () => {
            (0, jostraca_1.Content)(GITIGNORE_TOP);
        });
        const origdef = spec.def;
        const projdef = sanitizeDefName(node_path_1.default.basename(origdef));
        spec.def = projdef;
        (0, jostraca_1.Folder)({ name: spec.sdk_folder }, () => {
            (0, jostraca_1.File)({ name: '.gitignore' }, () => {
                (0, jostraca_1.Content)(GITIGNORE_SDK);
            });
            (0, jostraca_1.Folder)({ name: 'def' }, () => {
                // TODO: file existence check should be jostraca util
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
                // Re-emit the guide the Copy skipped, merged over whatever is already
                // there. On a fresh scaffold there is no existing file and this writes
                // the template unchanged; on a re-scaffold the user's overlay survives.
                (0, jostraca_1.Folder)({ name: 'guide' }, () => {
                    const guideTemplate = fs.readFileSync(node_path_1.default.join(from, spec.sdk_folder, ...GUIDE_REL), 'utf8');
                    const guidePath = node_path_1.default.join(folder, spec.sdk_folder, ...GUIDE_REL);
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
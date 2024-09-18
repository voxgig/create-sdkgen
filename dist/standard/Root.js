"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Root = void 0;
const node_path_1 = __importDefault(require("node:path"));
const jostraca_1 = require("jostraca");
const Root = (0, jostraca_1.cmp)(function Root(props) {
    const { model, ctx$ } = props;
    const { folder, meta } = ctx$;
    const { spec } = meta;
    console.log('Root 5');
    // console.log('SPEC', spec)
    (0, jostraca_1.names)(model, model.name);
    // console.log('MODEL')
    // console.dir(model, { depth: null })
    ctx$.model = model;
    let createInfo = { exclude: [], last: Number.MAX_SAFE_INTEGER };
    try {
        createInfo = JSON.parse(ctx$.fs.readFileSync(node_path_1.default.join(folder, '.voxgig', 'create-sdkgen.json'), 'utf8'));
    }
    catch (err) {
        console.log(err);
        // TODO: file not foound ignored, handle others!
    }
    ctx$.info = createInfo;
    console.log('INFO', ctx$.info);
    (0, jostraca_1.Project)({ folder }, () => {
        // TODO: perhaps remove the need for this, create top level folder in Project
        // would keep paths indo of project folder name
        (0, jostraca_1.Folder)({ name: node_path_1.default.basename(folder) }, () => {
            (0, jostraca_1.File)({ name: 'foo.txt' }, () => {
                (0, jostraca_1.Content)('FOO');
            });
            // console.log('FOLDER', folder)
            (0, jostraca_1.Copy)({ from: __dirname + '/../../tm/standard', name: folder });
            const def = model.def.filepath;
            if (null != def && '' !== def) {
                (0, jostraca_1.Folder)({ name: 'def' }, () => {
                    (0, jostraca_1.Copy)({ from: def, name: node_path_1.default.basename(def) });
                });
            }
            (0, jostraca_1.Folder)({ name: '.voxgig' }, () => {
                /*
                File({ name: 'create-sdkgen.json', exclude: false }, () => {
                  const exclude = ctx$.info.exclude
                  const info = {
                    last: Date.now(),
                    exclude,
                  }
                  console.log('INFO', info)
                  Content(JSON.stringify(info, null, 2))
                  })
                  */
            });
        });
    });
    // TODO: need mechanism to ensure this is last
    setTimeout(() => {
        try {
            const info = {
                last: Date.now(),
                exclude: ctx$.info.exclude,
            };
            ctx$.fs.writeFileSync(node_path_1.default.join(folder, '.voxgig', 'create-sdkgen.json'), JSON.stringify(info, null, 2));
        }
        catch (err) {
            console.log(err);
            // TODO: file not foound ignored, handle others!
        }
    }, 777);
});
exports.Root = Root;
//# sourceMappingURL=Root.js.map
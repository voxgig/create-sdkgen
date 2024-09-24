"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Root = void 0;
const node_path_1 = __importDefault(require("node:path"));
const jostraca_1 = require("jostraca");
const ModelSdk_1 = require("./ModelSdk");
const Root = (0, jostraca_1.cmp)(function Root(props) {
    const { model, ctx$ } = props;
    const { folder, meta } = ctx$;
    const { spec } = meta;
    (0, jostraca_1.names)(model, model.name);
    ctx$.model = model;
    (0, jostraca_1.Project)({ folder }, () => {
        // TODO: perhaps remove the need for this, create top level folder in Project
        // would keep paths indo of project folder name
        // Folder({ name: Path.basename(folder) }, () => {
        // File({ name: 'foo.txt' }, () => {
        //   Content('FOO')
        // })
        // console.log('FOLDER', folder)
        (0, jostraca_1.Copy)({ from: __dirname + '/../../tm/standard' });
        const def = model.def.filepath;
        if (null != def && '' !== def) {
            (0, jostraca_1.Folder)({ name: 'def' }, () => {
                (0, jostraca_1.Copy)({ from: def, name: node_path_1.default.basename(def) });
            });
        }
        (0, jostraca_1.Folder)({ name: 'model' }, () => {
            (0, ModelSdk_1.ModelSdk)({});
        });
        (0, jostraca_1.Folder)({ name: 'feature' }, () => {
            (0, jostraca_1.Copy)({ from: __dirname + '/../../feature/standard' });
        });
    });
});
exports.Root = Root;
//# sourceMappingURL=Root.js.map
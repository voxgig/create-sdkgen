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
    console.log('SPEC', spec);
    (0, jostraca_1.names)(model, model.name);
    console.log('MODEL');
    console.dir(model, { depth: null });
    ctx$.model = model;
    (0, jostraca_1.Project)({ folder }, () => {
        (0, jostraca_1.Folder)({ name: node_path_1.default.basename(folder) }, () => {
            // console.log('FOLDER', folder)
            (0, jostraca_1.Copy)({ from: __dirname + '/../../tm/standard', name: folder });
            const def = model.def.filepath;
            if (null != def && '' !== def) {
                (0, jostraca_1.Folder)({ name: 'def' }, () => {
                    (0, jostraca_1.Copy)({ from: def, name: node_path_1.default.basename(def) });
                });
            }
        });
    });
});
exports.Root = Root;
//# sourceMappingURL=Root.js.map
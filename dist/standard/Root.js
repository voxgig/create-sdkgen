"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Root = void 0;
const jostraca_1 = require("jostraca");
const Root = (0, jostraca_1.cmp)(function Root(props) {
    const { model, ctx$ } = props;
    const folder = ctx$.folder;
    (0, jostraca_1.names)(model, model.name);
    console.log('MODEL');
    console.dir(model, { depth: null });
    ctx$.model = model;
    (0, jostraca_1.Project)({}, () => {
        (0, jostraca_1.Folder)({ name: folder }, () => {
            console.log('FOLDER', folder);
            (0, jostraca_1.Copy)({ from: __dirname + '/../../tm/standard', name: folder });
        });
    });
});
exports.Root = Root;
//# sourceMappingURL=Root.js.map
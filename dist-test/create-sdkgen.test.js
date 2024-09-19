"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const code_1 = require("@hapi/code");
const aontu_1 = require("aontu");
const jostraca_1 = require("jostraca");
const __1 = require("../");
(0, node_test_1.describe)('create-sdkgen', () => {
    (0, node_test_1.test)('happy', async () => {
        (0, code_1.expect)(__1.CreateSdkGen).exist();
        /*
            const { fs, vol } = memfs({})
            const createsdkgen = CreateSdkGen({
              fs, folder: '/top'
            })
            expect(createsdkgen).exist()
        
            const root = makeRoot()
            const model = makeModel()
            // console.log('MODEL', model)
        
            const spec = {
              model,
              root
            }
        
            await createsdkgen.generate(spec)
        
            expect(vol.toJSON()).equal({
            })
            */
    });
    function makeModel() {
        return (0, aontu_1.Aontu)(`
a:1
`).gen();
    }
    function makeRoot() {
        return (0, jostraca_1.cmp)(function Root(props) {
            const { model } = props;
            (0, jostraca_1.Project)({ model }, () => {
                /*
                each(model.main.sdk, (sdk: any) => {
                  Folder({ name: sdk.name }, () => {
                    File({ name: 'README.md' }, () => {
                      Code(`
        # ${model.name} ${sdk.name} SDK
          `)
                    })
                  })
                  })
                  */
            });
        });
    }
});
//# sourceMappingURL=create-sdkgen.test.js.map
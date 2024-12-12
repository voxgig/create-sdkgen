"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelSdk = void 0;
const jostraca_1 = require("jostraca");
const ModelSdk = (0, jostraca_1.cmp)(function ModelSdk(props) {
    const { spec } = props;
    (0, jostraca_1.File)({ name: 'sdk.jsonic' }, () => {
        (0, jostraca_1.Fragment)({
            from: __dirname + '/../../project/generate/model/sdk.fragment.jsonic',
            replace: {
                NAME: spec.name,
                DEF: spec.def,
            }
        });
        /*
            Content(`
        
        # Defaults and type definitions
        @"@voxgig/apidef/model/apidef.jsonic"
        @"@voxgig/sdkgen/model/sdkgen.jsonic"
        
        
        # SDK Details
        name: '${spec.name}'
        def: '${spec.def}'
        
        
        # Generated API description (from external specificaton).
        @"api-generated.jsonic"
        
        
        # Original external specification.
        @"def-generated.jsonic"
        
        
        # Generation guide.
        main: guide: @"guide.jsonic"
        
        
        # SDK Target details.
        main: sdk: target: {}
        
        
        # SDK Entity details.
        main: sdk: entity: {}
        
        
        # SDK Faeture details.
        main: sdk: feature: {}
        
        
        `)
        
        */
    });
});
exports.ModelSdk = ModelSdk;
//# sourceMappingURL=ModelSdk.js.map
import { Pino } from '@voxgig/util';
type FullCreateSdkGenOptions = {
    fs?: any;
    debug?: boolean | string;
    pino?: ReturnType<typeof Pino>;
};
type CreateSdkGenOptions = Partial<FullCreateSdkGenOptions>;
type GenerateSpec = {
    sdk_folder: string;
    name: string;
    def: string;
    root: string;
    project: string;
    debug?: string;
    dryrun?: boolean;
    target?: string[];
    feature?: string[];
    install?: boolean;
    folder?: string;
};
declare function CreateSdkGen(opts: FullCreateSdkGenOptions): {
    generate: (spec: GenerateSpec) => Promise<void>;
};
export type { CreateSdkGenOptions, };
export { CreateSdkGen, };

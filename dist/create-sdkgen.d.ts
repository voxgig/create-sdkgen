type FullCreateSdkGenOptions = {
    folder: string;
    fs: any;
    model: any;
    meta: any;
    rootpath: string;
};
type CreateSdkGenOptions = Partial<FullCreateSdkGenOptions>;
type GenerateSpec = {
    watch: string[];
};
declare function CreateSdkGen(opts: FullCreateSdkGenOptions): {
    generate: (spec: any) => Promise<void>;
    watch: (spec: GenerateSpec) => Promise<void>;
};
export type { CreateSdkGenOptions, };
export { CreateSdkGen, };

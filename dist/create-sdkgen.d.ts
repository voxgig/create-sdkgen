type FullCreateSdkGenOptions = {
    folder: string;
    fs: any;
    model: any;
    meta: any;
    rootpath: string;
};
type CreateSdkGenOptions = Partial<FullCreateSdkGenOptions>;
declare function CreateSdkGen(opts: CreateSdkGenOptions): {
    generate: (spec: any) => Promise<void>;
    watch: (spec: any) => Promise<void>;
};
export type { CreateSdkGenOptions, };
export { CreateSdkGen, };

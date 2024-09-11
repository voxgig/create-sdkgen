type FullCreateSdkGenOptions = {
    folder: string;
    fs: any;
    model: any;
    meta: any;
};
type CreateSdkGenOptions = Partial<FullCreateSdkGenOptions>;
declare function CreateSdkGen(opts: CreateSdkGenOptions): {
    generate: (spec: any) => Promise<void>;
};
export type { CreateSdkGenOptions, };
export { CreateSdkGen, };

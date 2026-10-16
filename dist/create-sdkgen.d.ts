import { Pino } from '@voxgig/util';
import { TARGETS, forwardingError } from './args';
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
type Host = {
    platform: string;
    env: Record<string, string | undefined>;
    execPath: string;
    exists: (path: string) => boolean;
};
type NpmLaunch = {
    command: string;
    args: string[];
    shell?: boolean;
};
declare function npmLaunch(args: string[], host?: Host): NpmLaunch;
declare function npmEnv(host?: Host): Record<string, string | undefined>;
export type { CreateSdkGenOptions, Host, NpmLaunch, };
export { CreateSdkGen, TARGETS, forwardingError, npmEnv, npmLaunch, };

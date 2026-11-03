type CopyMode = 'merge' | 'overwrite';
declare const MERGE: CopyMode;
declare const OVERWRITE: CopyMode;
type GuardSpec = {
    fs: any;
    folder: string;
    log: any;
    mode: CopyMode;
    what: string;
    force?: boolean;
    keep?: boolean;
    dryrun?: boolean;
    manage: (rel: string) => boolean;
    recorded: (rel: string) => string | undefined;
    fingerprint: (content: any) => string;
    basedir: string;
    conflictdir: string;
    versions?: (abs: string) => Iterable<Buffer>;
    error?: (msg: string) => Error;
};
type MergeOutcome = {
    merged: string[];
    kept: string[];
    retained: string[];
    spared: string[];
};
declare function copyMode(value: any): CopyMode;
declare function withCopyMerge<T>(spec: GuardSpec, run: (fs: any) => Promise<T>): Promise<T>;
declare function merge3(incoming: Buffer, base: Buffer, local: Buffer, what: string): {
    conflict: boolean;
    content: Buffer;
};
declare function gitVersions(abs: string, limit?: number): Iterable<Buffer>;
export type { CopyMode, GuardSpec, MergeOutcome, };
export { MERGE, OVERWRITE, copyMode, withCopyMerge, gitVersions, merge3, };

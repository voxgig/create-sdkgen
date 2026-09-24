type Warn = (file: string, note: string) => void;
type Scaffold = {
    kept: Set<string>;
    replaced: Set<string>;
};
declare function rewriteIncludes(src: string, rename: (path: string) => boolean): string;
declare function scaffoldFiles(fs: any, templateSdk: string, kept: string[]): Scaffold;
declare function migrateToAontu(fs: any, sdk: string, scaffold: Scaffold, warn: Warn): void;
export { migrateToAontu, rewriteIncludes, scaffoldFiles, };

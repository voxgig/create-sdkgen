type Warn = (file: string, note: string) => void;
type Scaffold = {
    kept: Set<string>;
    replaced: Set<string>;
};
type Include = (path: string) => boolean;
declare function rewriteIncludes(src: string, rename: Include, local?: Include): string;
declare function scaffoldFiles(fs: any, templateSdk: string, kept: string[]): Scaffold;
declare function migrateToAontu(fs: any, sdk: string, scaffold: Scaffold, warn: Warn): void;
export { migrateToAontu, rewriteIncludes, scaffoldFiles, };

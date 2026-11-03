import type { CopyMode } from './copymerge';
declare const SCAFFOLD_LOG = ".sdk/log/scaffold.jsonl";
declare const SCAFFOLD_BASE = ".sdk/log/scaffold-base";
declare const SCAFFOLD_CONFLICT = ".sdk/log/scaffold-conflict";
declare function fingerprint(content: any): string;
declare function scaffoldMode(fs: any, folder: string): CopyMode;
declare function readScaffold(fs: any, folder: string): Record<string, string>;
declare function recordScaffold(fs: any, folder: string, jres: any, version: string, manage: (rel: string) => boolean, record: Record<string, string>): void;
export { SCAFFOLD_LOG, SCAFFOLD_BASE, SCAFFOLD_CONFLICT, fingerprint, scaffoldMode, readScaffold, recordScaffold, };

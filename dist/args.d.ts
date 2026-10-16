declare const TARGETS: string[];
type Env = Record<string, string | undefined>;
declare function forwardingError(name: string, positionalTargets: string[], env: Env): string | undefined;
export { TARGETS, forwardingError, };

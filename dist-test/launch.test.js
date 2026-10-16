"use strict";
/* Copyright (c) 2026 Richard Rodger, MIT License */
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
const create_sdkgen_1 = require("../dist/create-sdkgen");
const NODE_WIN = 'C:\\Program Files\\nodejs\\node.exe';
const BUNDLED = 'C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js';
const RUNNING = 'C:\\Users\\a\\AppData\\Roaming\\npm\\node_modules\\npm\\bin\\npm-cli.js';
function host(platform, env, present = []) {
    return {
        platform,
        env,
        execPath: 'win32' === platform ? NODE_WIN : '/usr/local/bin/node',
        exists: (path) => present.includes(path),
    };
}
(0, node_test_1.describe)('npm-launch', () => {
    (0, node_test_1.test)('elsewhere, npm is spawned by name', () => {
        (0, node_assert_1.deepEqual)((0, create_sdkgen_1.npmLaunch)(['install'], host('linux', {})), { command: 'npm', args: ['install'] });
        (0, node_assert_1.deepEqual)((0, create_sdkgen_1.npmLaunch)(['install'], host('darwin', { npm_execpath: '/x/npm-cli.js' }, ['/x/npm-cli.js'])), { command: 'npm', args: ['install'] });
    });
    (0, node_test_1.test)('on Windows, the npm that launched the run is run on this node', () => {
        (0, node_assert_1.deepEqual)((0, create_sdkgen_1.npmLaunch)(['run', 'add-target', 'ts,py'], host('win32', { npm_execpath: RUNNING }, [RUNNING, BUNDLED])), { command: NODE_WIN, args: [RUNNING, 'run', 'add-target', 'ts,py'] });
    });
    (0, node_test_1.test)('on Windows, with no npm_execpath, the npm shipped beside node runs', () => {
        (0, node_assert_1.deepEqual)((0, create_sdkgen_1.npmLaunch)(['install'], host('win32', {}, [BUNDLED])), { command: NODE_WIN, args: [BUNDLED, 'install'] });
    });
    (0, node_test_1.test)("on Windows, another package manager's entry script is not run as npm", () => {
        const pnpm = 'C:\\pnpm\\bin\\pnpm.cjs';
        (0, node_assert_1.deepEqual)((0, create_sdkgen_1.npmLaunch)(['install'], host('win32', { npm_execpath: pnpm }, [pnpm, BUNDLED])), { command: NODE_WIN, args: [BUNDLED, 'install'] });
    });
    (0, node_test_1.test)('on Windows, with no npm-cli.js at all, npm.cmd runs through the shell', () => {
        const launch = (0, create_sdkgen_1.npmLaunch)(['run', 'add-feature', 'test'], host('win32', {}));
        (0, node_assert_1.deepEqual)(launch, { command: 'npm.cmd "run" "add-feature" "test"', args: [], shell: true });
        (0, node_assert_1.throws)(() => (0, create_sdkgen_1.npmLaunch)(['run', 'add-target', '%PATH%'], host('win32', {})), /cmd\.exe/);
        (0, node_assert_1.throws)(() => (0, create_sdkgen_1.npmLaunch)(['run', 'add-target', 'a"b'], host('win32', {})), /cmd\.exe/);
    });
    (0, node_test_1.test)('the child finds this node first, under the PATH key the platform uses', () => {
        (0, node_assert_1.deepEqual)((0, create_sdkgen_1.npmEnv)(host('win32', { Path: 'C:\\Windows' })), { Path: 'C:\\Program Files\\nodejs;C:\\Windows' });
        (0, node_assert_1.equal)((0, create_sdkgen_1.npmEnv)(host('linux', { PATH: '/usr/bin' })).PATH, '/usr/local/bin:/usr/bin');
        (0, node_assert_1.equal)((0, create_sdkgen_1.npmEnv)(host('linux', {})).PATH, '/usr/local/bin', 'no empty element, which is the cwd');
    });
});
//# sourceMappingURL=launch.test.js.map
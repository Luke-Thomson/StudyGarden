import type { PluginFn } from '../types.js';
/**
 * Disallows pinned tests by throwing an error before the runner
 * starts executing the tests.
 */
export declare function disallowPinnedTests(options?: {
    disallow?: boolean;
    errorMessage?: string;
}): PluginFn;

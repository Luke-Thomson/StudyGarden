/**
 * This class is responsible for checking if a given specifier
 * is imported dynamically from a given parent file.
 * Otherwise we will throw an error since we cannot make the file reloadable
 *
 * We are caching the results to avoid reading the same file multiple times
 */
export declare class DynamicImportChecker {
    private cache;
    ensureFileIsImportedDynamicallyFromParent(parentPath: string, specifier: string): Promise<boolean>;
    invalidateCache(key: string): void;
}

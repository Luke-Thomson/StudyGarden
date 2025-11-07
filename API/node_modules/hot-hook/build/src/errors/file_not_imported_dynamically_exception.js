import { relative } from 'node:path';
export class FileNotImportedDynamicallyException extends Error {
    constructor(parentPath, specifier, projectRoot) {
        super(`The import "${specifier}" is not imported dynamically from ${relative(projectRoot, parentPath)}.\nYou must use dynamic import to make it reloadable (HMR) with hot-hook.`);
    }
}

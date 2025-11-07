import { dirname, relative } from 'node:path';
export default class DependencyTree {
    #tree;
    #pathMap = new Map();
    constructor(options) {
        if (options.root)
            this.addRoot(options.root);
    }
    addRoot(path) {
        this.#tree = {
            version: 0,
            parents: null,
            reloadable: false,
            path: path,
            dependents: new Set(),
            dependencies: new Set(),
        };
        this.#pathMap.set(this.#tree.path, this.#tree);
    }
    /**
     * Get the version of a file
     */
    getVersion(path) {
        const node = this.#pathMap.get(path);
        if (!node)
            throw new Error(`Node ${path} does not exist`);
        return node.version;
    }
    /**
     * Add a dependency to a file
     */
    addDependency(parentPath, dependency) {
        let parentNode = this.#pathMap.get(parentPath);
        if (!parentNode)
            return;
        let childNode = this.#pathMap.get(dependency.path);
        if (!childNode) {
            childNode = {
                version: 0,
                path: dependency.path,
                parents: new Set(),
                dependents: new Set(),
                dependencies: new Set(),
                reloadable: dependency.reloadable || false,
                isWronglyImported: dependency.isWronglyImported || false,
            };
            this.#pathMap.set(dependency.path, childNode);
        }
        else {
            childNode.reloadable = dependency.reloadable || false;
            childNode.isWronglyImported = dependency.isWronglyImported || false;
        }
        childNode.parents?.add(parentNode);
        parentNode.dependencies.add(childNode);
        this.addDependent(dependency.path, parentPath);
    }
    /**
     * Add a dependent to a file
     */
    addDependent(dependentPath, parentPath) {
        let dependentNode = this.#pathMap.get(dependentPath);
        if (!dependentNode)
            return;
        let parentNode = this.#pathMap.get(parentPath);
        if (!parentNode)
            return;
        dependentNode.dependents.add(parentNode);
    }
    /**
     * Invalidate a file and all its dependents
     */
    invalidateFileAndDependents(filePath) {
        const invalidatedFiles = new Set();
        const queue = [filePath];
        while (queue.length > 0) {
            const currentPath = queue.pop();
            if (!invalidatedFiles.has(currentPath)) {
                const node = this.#pathMap.get(currentPath);
                if (!node)
                    continue;
                if (!this.isReloadable(currentPath).reloadable)
                    continue;
                node.version++;
                invalidatedFiles.add(currentPath);
                queue.push(...Array.from(node.dependents).map((n) => n.path));
            }
        }
        return invalidatedFiles;
    }
    /**
     * Remove a file from the dependency tree
     */
    remove(path) {
        const node = this.#pathMap.get(path);
        if (!node)
            return;
        if (node.parents) {
            for (const parent of node.parents) {
                parent.dependencies.delete(node);
            }
        }
        if (node.dependents) {
            for (const dependent of node.dependents) {
                dependent.parents?.delete(node);
            }
        }
        this.#pathMap.delete(path);
    }
    /**
     * Check if a file is reloadable.
     * Basically the algorithm is :
     * - For a given file, we will go up the whole dependency tree until we can reach the ROOT file
     *  = the entry point of the application/the executed script
     * - If we can reach the ROOT file without encountering any reloadable file, then it means we
     *  need to do a FULL RELOAD.
     * - If all paths to reach the ROOT file go through reloadable files, then it means we can do HMR !
     */
    isReloadable(path) {
        const node = this.#pathMap.get(path);
        if (!node)
            throw new Error(`Node ${path} does not exist`);
        const checkPathToRoot = (currentNode, visited = new Set()) => {
            if (currentNode.isWronglyImported) {
                return { reloadable: false, shouldBeReloadable: true };
            }
            if (currentNode.reloadable) {
                return { reloadable: true, shouldBeReloadable: true };
            }
            if (visited.has(currentNode.path)) {
                return { reloadable: true, shouldBeReloadable: true };
            }
            visited.add(currentNode.path);
            if (!currentNode.parents || currentNode.parents.size === 0) {
                return { reloadable: false, shouldBeReloadable: false };
            }
            for (const parent of currentNode.parents) {
                const { reloadable, shouldBeReloadable } = checkPathToRoot(parent, new Set(visited));
                if (!reloadable)
                    return { reloadable: false, shouldBeReloadable };
            }
            return { reloadable: true, shouldBeReloadable: true };
        };
        const result = checkPathToRoot(node);
        return result;
    }
    dump() {
        const rootDirname = dirname(this.#tree.path);
        const isNodeModule = (path) => path.includes('node_modules');
        return Array.from(this.#pathMap.values()).map((node) => ({
            version: node.version,
            boundary: node.reloadable,
            path: relative(rootDirname, node.path),
            dependents: Array.from(node.dependents).map((n) => relative(rootDirname, n.path)),
            dependencies: Array.from(node.dependencies).map((n) => relative(rootDirname, n.path)),
            reloadable: isNodeModule(node.path) ? false : this.isReloadable(node.path).reloadable,
        }));
    }
}

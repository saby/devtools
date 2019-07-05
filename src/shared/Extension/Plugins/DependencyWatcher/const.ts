export const PLUGIN_NAME = 'dependency-watcher';

export enum EventNames {
    addDependency = "addDependency",
    define = "define",
    require = "require",
    update = "update"
}

export enum RPCMethodNames {
    getBundles = 'getBundles',
    getModules = 'getModules',
    getNewModules = 'getNewModules',
    setSize = 'setSize',
    getFiles = 'getFiles',
    isRelease = 'isRelease',
}

export const GLOBAL_MODULE_NAME = '~> page <~';

export const TYPESCRIPT_HELPERS_MODULE = [
    "module",
    "require",
    'exports',
    'tslib'
];

export enum DependencyType {
    static = "static",
    dynamic = "dynamic"
}

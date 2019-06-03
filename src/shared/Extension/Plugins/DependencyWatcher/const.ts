export const PLUGIN_NAME = 'dependency-watcher';

export enum EventNames {
    addDependency = "addDependency",
    defineModule = "defineModule",
    require = "require",
    update = "update"
}

export enum RPCMethods {
    getBundles = 'getBundles',
    getModulesList = 'getModuleList',
    getModules = 'getModules',
    hasNewModules = 'hasNewModules',
}

export const GLOBAL_MODULE_NAME = '~> page <~';

export const TYPESCRIPT_HELPERS_MODULE = [
    "require",
    'exports',
    'tslib'
];

export const IGNORE_PREFIX = [
    'browser!',
    'optional!',
    'preload!'
];

export enum DependencyType {
    static = "static",
    dynamic = "dynamic"
}

export const PLUGIN_NAME = 'dependency-watcher';

export enum EventNames {
    addDependency = "addDependency",
    define = "define",
    require = "require",
    update = "update"
}

export enum RPCMethodNames {
    // Modules
    getModules = 'getModules',
    getUpdates = 'getUpdates',
    // Items
    getItems = 'getItems',
    queryItems = 'queryItems',
    // File
    setSize = 'setSize',
    getFiles = 'getFiles',
    getStacks = 'getStacks',
    queryFiles = 'queryFiles',
    updateFile = 'updateFile',
    updateFiles = 'updateFiles',
    // other
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

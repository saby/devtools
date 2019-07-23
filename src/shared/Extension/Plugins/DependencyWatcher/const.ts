export const PLUGIN_NAME = 'dependency-watcher';

export enum EventNames {
    define = "define",
    require = "require",
    update = "update"
}

export enum RPCMethodNames {
    // Modules
    getModules = 'getModules',
    getUpdates = 'getUpdates',
    hasUpdates = 'hasUpdates',
    // Items
    getItems = 'getItems',
    queryItems = 'queryItems',
    updateItem = 'updateItem',
    updateItems = 'updateItems',
    // File
    getFiles = 'getFiles',
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

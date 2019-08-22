export const PLUGIN_NAME = 'dependency-watcher';

export enum EventNames {
    define = "define",
    require = "require",
    update = "update"
}

export enum RPCMethodNames {
    //
    moduleGetItems = 'module.getItems',
    moduleHasUpdates = 'module.hasUpdates',
    moduleQuery = 'module.query',
    moduleUpdateItems = 'module.updateItems',
    moduleOpenSource = 'module.openSource',
    //
    fileGetItems = 'file.getItems',
    fileHasUpdates = 'file.hasUpdates',
    fileQuery = 'file.query',
    fileUpdateItems = 'file.updateItems',
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

export const RESOURCE_ROOT = '/resources/';
export const CDN_ROOT = '/cdn/';

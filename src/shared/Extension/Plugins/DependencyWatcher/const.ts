export const PLUGIN_NAME = 'dependency-watcher';

export enum EventNames {
   define = 'define',
   require = 'require',
   update = 'update'
}

export enum RPCMethodNames {
   moduleGetItems = 'module.getItems',
   moduleHasUpdates = 'module.hasUpdates',
   moduleQuery = 'module.query',
   moduleOpenSource = 'module.openSource',

   fileGetItems = 'file.getItems',
   fileQuery = 'file.query'
}

export const GLOBAL_MODULE_NAME = '~> page <~';

export enum DependencyType {
   static = 'static',
   dynamic = 'dynamic'
}

export const RESOURCE_ROOT = '/resources/';
export const CDN_ROOT = '/cdn/';

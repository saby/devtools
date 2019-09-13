import { IDependencies } from 'Extension/Plugins/DependencyWatcher/IModule';

export function hasChildren(deps: IDependencies<number[]>): boolean | null {
   return (
      (deps.dynamic && deps.dynamic.length > 0) ||
      (deps.static && deps.static.length > 0) ||
      null
   );
}

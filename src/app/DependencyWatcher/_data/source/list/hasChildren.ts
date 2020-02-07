import { IDependencies } from 'Extension/Plugins/DependencyWatcher/IModule';

/**
 * Returns whether a module has dependencies.
 * @author Зайцев А.С.
 */
export function hasChildren(deps: IDependencies<number[]>): true | null {
   return (
      (deps.dynamic && deps.dynamic.length > 0) ||
      (deps.static && deps.static.length > 0) ||
      null
   );
}

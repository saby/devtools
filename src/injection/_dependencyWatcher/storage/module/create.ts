import { IModule } from 'Extension/Plugins/DependencyWatcher/IModule';
import { getId } from '../getId';
import { GLOBAL_MODULE_NAME } from 'Extension/Plugins/DependencyWatcher/const';
import isDeprecated from './isDeprecated';

/**
 * Creates object which serves as a module description.
 * @author Зайцев А.С.
 */
function create(name: string, parentDefined: boolean): IModule {
   const module: IModule = {
      name,
      fileId: Number.MIN_SAFE_INTEGER,
      defined: false,
      initialized: false,
      id: getId(),
      dependencies: {
         static: new Set(),
         dynamic: new Set()
      },
      dependent: {
         static: new Set(),
         dynamic: new Set()
      },
      isDeprecated: isDeprecated(name)
   };
   /*
   For some types of modules it is impossible to catch when they get defined or initialized,
   because they're not wrapped in define.

   If the parent is defined, then we can safely assume that these resources are defined
   and initialized. Even if they're not loaded now, they're going to get loaded in a very short time.

   If the parent gets defined at some point later, we're going to catch these modules
   in rpcStorage/Module#_setDefined().
    */
   if (
      name === GLOBAL_MODULE_NAME ||
      (parentDefined && (name.includes('json!') || name.includes('css!')))
   ) {
      module.defined = true;
      module.initialized = true;
   }
   return module;
}

export default create;

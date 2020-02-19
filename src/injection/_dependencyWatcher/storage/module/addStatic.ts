import { IModule } from 'Extension/Plugins/DependencyWatcher/IModule';

/**
 * Adds static dependencies to module description.
 * @author Зайцев А.С.
 */
function addStatic(module: IModule, dependencies: IModule[]): IModule[] {
   const withoutExisting = dependencies.filter(
      (dependency) => !module.dependencies.static.has(dependency)
   );
   withoutExisting.forEach((dependency) => {
      module.dependencies.static.add(dependency);
      dependency.dependent.static.add(module);
   });
   return withoutExisting;
}

export default addStatic;

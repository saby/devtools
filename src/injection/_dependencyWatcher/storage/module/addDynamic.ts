import { IModule } from 'Extension/Plugins/DependencyWatcher/IModule';

/**
 * Adds dynamic dependencies to module description.
 * @author Зайцев А.С.
 */
function addDynamic(module: IModule, dependencies: IModule[]): IModule[] {
   const withoutStatic = dependencies.filter(
      (dependency) => !module.dependencies.static.has(dependency)
   );

   const withoutExisting = withoutStatic.filter(
      (dependency) => !module.dependencies.dynamic.has(dependency)
   );

   withoutStatic.forEach((dependency) => {
      module.dependencies.dynamic.add(dependency);
      dependency.dependent.dynamic.add(module);
   });

   return withoutExisting;
}

export default addDynamic;

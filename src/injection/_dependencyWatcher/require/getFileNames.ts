import { IRequire } from './IRequire';
import { pathPlugins } from './pathPlugins';
import { GLOBAL_MODULE_NAME } from 'Extension/Plugins/DependencyWatcher/const';
import { IModule } from 'Extension/Plugins/DependencyWatcher/IModule';

function findFiles(
   bundles: Record<string, string[]>,
   module: string
): string[] {
   const result: string[] = [];
   Object.entries(bundles).forEach(([bundleName, bundle]) => {
      if (bundle.includes(module)) {
         result.push(bundleName);
      }
   });
   return result;
}

function getBundles(
   moduleName: string,
   bundles: Record<string, string[]>,
   isRelease: boolean
): string[] | void {
   if (!isRelease) {
      return;
   }
   const files = findFiles(bundles, moduleName);
   if (files.length) {
      return files.map((file) => file + '.js');
   }
}

export function getFileNames(
   moduleName: string,
   require: IRequire,
   isRelease: boolean,
   bundles: Record<string, string[]>,
   staticDependents: Set<IModule>
): string[] {
   if (moduleName === GLOBAL_MODULE_NAME) {
      return [location.href];
   }
   const fileNamesFromBundles = getBundles(moduleName, bundles, isRelease);
   if (fileNamesFromBundles) {
      return fileNamesFromBundles;
   }
   let result: string[] = [];
   for (const plugin of pathPlugins) {
      const path = plugin(moduleName, require, isRelease);
      if (path) {
         result.push(path);
      }
   }
   if (staticDependents.size) {
      staticDependents.forEach((value) => {
         result = result.concat(getFileNames(value.name, require, isRelease, bundles, value.dependent.static));
      });
   }
   return result;
}

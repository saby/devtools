import { IRequire } from './IRequire';
import { pathPlugins } from './pathPlugins';
import { GLOBAL_MODULE_NAME } from 'Extension/Plugins/DependencyWatcher/const';
import { IModule } from 'Extension/Plugins/DependencyWatcher/IModule';

function findFiles(
   bundles: Record<string, string[]>,
   module: string
): string[] {
   return Object.keys(bundles).filter((bundleName) =>
      bundles[bundleName].includes(module)
   );
}

function getBundles(
   moduleName: string,
   bundles: Record<string, string[]>,
   isRelease: boolean
): string[] | void {
   if (!isRelease) {
      return;
   }
   const files = findFiles(bundles, moduleName).map((file) => file + '.js');
   return files.length ? files : undefined;
}

const localizationRegexp = /^[\d\w._]+_localization$/;
const hardPlugins = ['i18n!', 'css!', 'wml!', 'tmpl!'];

function shouldCheckStaticDependents(moduleName: string): boolean {
   const isHard = hardPlugins.some((plugin) => moduleName.startsWith(plugin));
   return isHard || localizationRegexp.test(moduleName);
}

/**
 * Returns a list of possible file names for a module.
 * @author Зайцев А.С.
 */
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
   /*
   For some types of modules, it is impossible to infere file name of a module using only it's name.
   So we're trying to get file names using it's static dependents, because most likely they're in the same file.
    */
   if (shouldCheckStaticDependents(moduleName)) {
      staticDependents.forEach((dependent) => {
         if (dependent.defined) {
            result = result.concat(
               getFileNames(
                  dependent.name,
                  require,
                  isRelease,
                  bundles,
                  dependent.dependent.static
               )
            );
         }
      });
   }
   return result;
}

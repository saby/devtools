/**
 * @typedef {Function} ReplaceFunction.<T>
 * @param {String} name
 * @param {TCollection} origin
 * @return TCollection
 */
type ReplaceFunction<T = unknown> = (name: string, origin: T) => T;

interface IR1 {
   moduleName: string;
   dependencies: string[];
   args: unknown[];
}

interface IR2 extends IR1 {
   dependencyName: string;
   getReplacement<T = unknown>(name: string, origin: T): T;
}

/**
 * @param {String} moduleName Имя модуля
 * @param {String} dependencyName Имя подменяемой зависимости
 * @param {Array.<*>} args Массив аргументов
 * @param {Array.<String>} dependencies Список зависимостей модуля
 * @param {ReplaceFunction} getReplacement Список зависимостей модуля
 */
function replaceDependency({
   moduleName,
   dependencyName,
   dependencies,
   args,
   getReplacement
}: IR2): void {
   if (!dependencies.includes(dependencyName)) {
      return;
   }
   const index = dependencies.indexOf(dependencyName);
   const origin = args[index];
   args[index] = getReplacement(moduleName, origin);
}

interface IR3 extends IR1 {
   proxyModules: {
      [dependencyName: string]: ReplaceFunction;
   };
}

/**
 * Replaces modules that do dynamic imports (require, Core/library, Core/moduleStubs) with proxies.
 * @param {String} moduleName Имя модуля
 * @param {String} proxyModules Объект с подменяемыми зависимостями
 * @param {Array.<*>} args Массив аргументов
 * @param {Array.<String>} dependencies Список зависимостей модуля
 * @author Зайцев А.С.
 */
export function replaceDependencies({
   moduleName,
   proxyModules,
   args,
   dependencies
}: IR3): unknown[] {
   if (proxyModules.hasOwnProperty(moduleName)) {
      return args;
   }
   const newArgs = [...args];
   Object.keys(proxyModules).forEach((dependencyName) => {
      replaceDependency({
         moduleName,
         dependencyName,
         dependencies,
         args: newArgs,
         getReplacement: proxyModules[dependencyName]
      });
   });
   return newArgs;
}

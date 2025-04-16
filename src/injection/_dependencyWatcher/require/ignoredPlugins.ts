export type IRequirePlugin<T = string> = (module: string) => T;

function replacePrefix(prefix: string): IRequirePlugin {
   return (module: string) => {
      return module.replace(prefix, '');
   };
}

const browser: IRequirePlugin<string> = replacePrefix('browser!');

const isBrowser: IRequirePlugin<string> = replacePrefix('is!browser?');

const optional: IRequirePlugin<string> = replacePrefix('optional!');

const preload: IRequirePlugin<string> = replacePrefix('preload!');

/**
 * Returns formatters for every require plugin that doesn't affect the path. Each formatter takes a module name and removes prefixes.
 * @author Зайцев А.С.
 */
export const ignoredPlugins: Array<IRequirePlugin<string>> = [
   browser,
   optional,
   preload,
   isBrowser
];

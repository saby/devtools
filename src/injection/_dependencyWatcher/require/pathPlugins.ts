import { IRequire } from './IRequire';

type IRequirePlugin<T = string> = (
   module: string,
   require: IRequire,
   isRelease: boolean
) => T;

function clearPath(path: string): string {
   return path.replace(/^\//, '').replace(/\?.+/, '');
}

function fileFormat(
   prefix: string,
   ext: string
): IRequirePlugin<void | string> {
   return (module: string, require: IRequire): void | string => {
      if (!module.includes(prefix)) {
         return;
      }
      const _name = module.replace(prefix, '');
      const path = clearPath(require.toUrl(_name));
      if (path.endsWith(ext)) {
         return path;
      }
      return path + ext;
   };
}

function cdn(moduleName: string): void | string {
   if (!moduleName.startsWith('cdn!')) {
      return;
   }
   return moduleName.replace('cdn!', '/cdn/');
}

const json: IRequirePlugin<void | string> = fileFormat('json!', '.json');

const css: IRequirePlugin<void | string> = fileFormat('css!', '.css');

function cssTheme(moduleName: string, require: IRequire): string | void {
   if (!moduleName.includes('css!theme?')) {
      return;
   }
   const _name = moduleName
      .replace('css!theme?', '')
      .replace('.css', '')
      .replace('.package', '');
   const path = clearPath(require.toUrl(_name));
   return path + '_';
}

const wml: IRequirePlugin<void | string> = fileFormat('wml!', '.wml');

const tmpl: IRequirePlugin<void | string> = fileFormat('tmpl!', '.tmpl');

const text: IRequirePlugin<void | string> = fileFormat('text!', '');

let postfix: string;

function getPostfix(): string {
   if (!postfix) {
      const langMatch = document.cookie.match(/lang=([A-z-]+)/);
      const lang = (langMatch && langMatch[1]) || 'ru-RU';
      postfix = `/lang/${lang}/${lang}.json`;
   }
   return postfix;
}

const i18n: IRequirePlugin<void | string> = (
   moduleName: string
): void | string => {
   const prefix = 'i18n!';
   if (!moduleName.includes(prefix)) {
      return;
   }
   const module = moduleName.replace(prefix, '').split('/')[0];
   return module + getPostfix();
};

function js(moduleName: string, require: IRequire, isRelease: boolean): string {
   const nameParts = moduleName.split(/[?!]/);
   const normalizedPath = clearPath(
      require.toUrl(nameParts[nameParts.length - 1])
   );
   let cleanPath: string = normalizedPath;
   if (isRelease && moduleName.includes('!')) {
      const pathParts = normalizedPath.split('/');
      const uniqueParts = new Set(pathParts);
      if (uniqueParts.size !== pathParts.length) {
         cleanPath = pathParts.slice(0, -1).join('/');
      }
   }
   if (cleanPath.endsWith('js')) {
      return cleanPath;
   } else {
      return cleanPath + '.js';
   }
}

/**
 * Returns formatters for every require plugin that can affect the path. Each formatter takes a module name and formats name based on the information available.
 * @author Зайцев А.С.
 */
export const pathPlugins: Array<IRequirePlugin<void | string>> = [
   json,
   cssTheme,
   css,
   wml,
   tmpl,
   text,
   i18n,
   cdn,
   js
];

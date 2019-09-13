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
   return (
      module: string,
      require: IRequire,
      isRelease: boolean
   ): void | string => {
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

const cdn: IRequirePlugin<void | string> = (
   moduleName: string
): void | string => {
   if (moduleName.startsWith('cdn!')) {
      return;
   }
   return moduleName.replace('cdn!', '/cdn/');
};

const json: IRequirePlugin<void | string> = fileFormat('json!', '.json');

const css: IRequirePlugin<void | string> = fileFormat('css!', '.css');

/*
 * т.к. в данном месте мы точно не знаем какая тема тянется, то имя конкретно определить не можем
 * по хорошему надо делать маску пути и соотношение файл-модуль не 1-n, а n-n
 */
const cssTheme: IRequirePlugin<void | string> = fileFormat('css!theme?', '_');

const wml: IRequirePlugin<void | string> = fileFormat('wml!', '.wml');

const tmpl: IRequirePlugin<void | string> = fileFormat('tmpl!', '.tmpl');

const text: IRequirePlugin<void | string> = fileFormat('text!', '');

const i18n: IRequirePlugin<void | string> = (() => {
   const langMatch = document.cookie.match(/lang=([A-z-]+)/);
   const lang = (langMatch && langMatch[1]) || 'ru-RU';
   const postfix = `/lang/${lang}/${lang}.json`;
   return (
      moduleName: string,
      require: IRequire,
      isRelease: boolean
   ): void | string => {
      const prefix = 'i18n!';
      if (!moduleName.includes(prefix)) {
         return;
      }
      const module = moduleName.replace(prefix, '').split('/')[0];
      if (!module) {
         return;
      }
      return module + postfix;
   };
})();

// закрывающий плагин, если не нашли другие то считаем что файл js по умолчанию
const js: IRequirePlugin<void | string> = fileFormat('', '.js');

/**
 * Плагины, влияющие на расширение файла
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

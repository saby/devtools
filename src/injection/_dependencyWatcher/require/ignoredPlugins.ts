export type IRequirePlugin<T = string> = (module: string) => T;

function replacePrefix(prefix: string): IRequirePlugin {
   return (module: string) => {
      return module.replace(prefix, '');
   };
}

const cdn: IRequirePlugin<string> = replacePrefix('cdn!');

const browser: IRequirePlugin<string> = replacePrefix('browser!');

const isBrowser: IRequirePlugin<string> = replacePrefix('is!browser?');

const optional: IRequirePlugin<string> = replacePrefix('optional!');

const preload: IRequirePlugin<string> = replacePrefix('preload!');

/*
let allPlugins = {
    'css': {},
    'native-css': {},
    'normalize': {},
    'html': {},
    'tmpl': {},
    'wml': {},
    'text': {},
    'is': {},
    'is-api': {},
    'i18n': {},
    'json': {},
    'order': {},
    'template': {},
    'cdn': {},
    'datasource': {},
    'xml': {},
    'preload': {},
    'browser': {},
    'optional': {},
    'remote': {}
};
*/

export const ignoredPlugins: Array<IRequirePlugin<string>> = [
   browser,
   optional,
   preload,
   isBrowser
];

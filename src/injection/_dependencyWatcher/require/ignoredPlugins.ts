export interface IRequirePlugin<T = string> {
    (module: string): T;
}

let replacePrefix = (prefix: string): IRequirePlugin => {
    return (module: string) => {
        return module.replace(prefix, '');
    };
};

export let cdn: IRequirePlugin<string> = replacePrefix('cdn!');

export let browser: IRequirePlugin<string> = replacePrefix('browser!');

export let isBrowser: IRequirePlugin<string> = replacePrefix('is!browser?');

export let optional: IRequirePlugin<string> = replacePrefix('optional!');

export let preload: IRequirePlugin<string> = replacePrefix('preload!');

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

export const ignoredPlugins: IRequirePlugin<string>[] = [
    browser, optional, preload, isBrowser
];

export interface IRequirePlugin<T = string> {
    (module: string): T;
}

let removePrefix = (prefix: string): IRequirePlugin => {
    return (module: string) => {
        return module.replace(prefix, '');
    };
};

interface Format {
    ext?: string;
    module: string
}
let fileFormat = (format: string): IRequirePlugin<Format> => {
    let pluginPrefix = `${ format }!`;
    let extension = `.${ format }`;
    return (module: string): Format => {
        if (module.includes(pluginPrefix) || module.includes(extension)) {
            return {
                ext: extension,
                module: module.replace(pluginPrefix, '').replace(extension, '')
            }
        }
        return {
            module
        };
    };
};

export let browser: IRequirePlugin<string> = removePrefix('browser!');

export let isBrowser: IRequirePlugin<string> = removePrefix('is!browser?');

export let optional: IRequirePlugin<string> = removePrefix('optional!');

export let preload: IRequirePlugin<string> = removePrefix('preload!');

export let js: IRequirePlugin<Format> = fileFormat('js');

export let json: IRequirePlugin<Format> = fileFormat('json');

export let css: IRequirePlugin<Format> = fileFormat('css');

export let wml: IRequirePlugin<Format> = fileFormat('wml');

export let tmpl: IRequirePlugin<Format> = fileFormat('tmpl');

// export let i18n: IRequirePlugin<Format> = (module: string): Format => {
//     if (module.includes('i18n')) {
//         return {
//             ext: extension,
//             module: module.replace(pluginPrefix, '').replace(extension, 'json')
//         }
//     }
//     return {
//         module
//     };
// };


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

/**
 * Плагины, которые можно игнорировать
 */
export let ignoredPlugins: IRequirePlugin<string>[] = [
    browser, optional, preload, isBrowser
];

/**
 * Плагины, влияющие на расширение файла
 */
export let extensionPlugins: IRequirePlugin<Format>[] = [
    json, css, wml, tmpl, js
];

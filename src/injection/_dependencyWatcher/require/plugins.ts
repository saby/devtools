export interface IRequirePlugin<T = string> {
    (module: string): T;
}

let replacePrefix = (prefix: string, newPrefix: string = ''): IRequirePlugin => {
    return (module: string) => {
        return module.replace(prefix, newPrefix);
    };
};

interface Format {
    ext: string;
    module: string
}
let fileFormat = (prefix: string, ext: string = `.${ prefix }`): IRequirePlugin<void | Format> => {
    let pluginPrefix = `${ prefix }!`;
    return (module: string): void | Format => {
        if (module.includes(pluginPrefix)) {
            return {
                ext,
                module: module.replace(pluginPrefix, '').replace(ext, '')
            }
        }
    };
};

export let cdn: IRequirePlugin<string> = replacePrefix('cdn!', '/cdn/');

export let browser: IRequirePlugin<string> = replacePrefix('browser!');

export let isBrowser: IRequirePlugin<string> = replacePrefix('is!browser?');

export let optional: IRequirePlugin<string> = replacePrefix('optional!');

export let preload: IRequirePlugin<string> = replacePrefix('preload!');

export let js: IRequirePlugin<void | Format> = fileFormat('js');

export let json: IRequirePlugin<void | Format> = fileFormat('json');

export let css: IRequirePlugin<void | Format> = fileFormat('css');

export let wml: IRequirePlugin<void | Format> = fileFormat('wml');

export let tmpl: IRequirePlugin<void | Format> = fileFormat('tmpl');

export let text: IRequirePlugin<void | Format> = fileFormat('text', '');

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
    browser, optional, preload, isBrowser, cdn
];

/**
 * Плагины, влияющие на расширение файла
 */
export let extensionPlugins: IRequirePlugin<void | Format>[] = [
    json, css, wml, tmpl, js, text
];

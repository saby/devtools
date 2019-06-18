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
    return (module: string): Format => {
        if (module.includes(pluginPrefix)) {
            return {
                ext: '.' + format,
                module: module.replace(pluginPrefix, '')
            }
        }
        return {
            module
        };
    };
};

export let browser: IRequirePlugin<string> = removePrefix('browser!');

export let optional: IRequirePlugin<string> = removePrefix('optional!');

export let preload: IRequirePlugin<string> = removePrefix('preload!');

export let json: IRequirePlugin<Format> = fileFormat('json');

export let css: IRequirePlugin<Format> = fileFormat('css');

export let wml: IRequirePlugin<Format> = fileFormat('wml');

export let tmpl: IRequirePlugin<Format> = fileFormat('tmpl');


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
    browser, optional, preload
];

/**
 * Плагины, влияющие на расширение файла
 */
export let extensionPlugins: IRequirePlugin<Format>[] = [
    json, css, wml, tmpl
];

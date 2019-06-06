export interface IRequirePlugin<T = string> {
    (module: string): T;
}

let removePrefix = (prefix: string): IRequirePlugin => {
    return (module: string) => {
        return module.replace(prefix, '');
    };
};

let fileFormat = (format: string): IRequirePlugin<string | false> => {
    let pluginPrefix = `${ format }!`;
    return (module: string): string | false => {
        if (module.includes(pluginPrefix)) {
            return module.replace(pluginPrefix, '') + `.${ format }`;
        }
        return false;
    };
};

export let browser: IRequirePlugin<string> = removePrefix('browser!');

export let optional: IRequirePlugin<string> = removePrefix('optional!');

export let preload: IRequirePlugin<string> = removePrefix('preload!');

export let json: IRequirePlugin<string | false> = fileFormat('json');

export let css: IRequirePlugin<string | false> = fileFormat('css');

export let wml: IRequirePlugin<string | false> = fileFormat('wml');

export let tmpl: IRequirePlugin<string | false> = fileFormat('tmpl');


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
export let ignoredPlugins = [
    browser, optional, preload
];

/**
 * Плагины, влияющие на расширение файла
 */
export let extensionPlugins = [
    json, css, wml, tmpl
];

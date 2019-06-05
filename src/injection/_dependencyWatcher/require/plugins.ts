export interface IRequirePlugin {
    (module: string): string;
}

let removePrefix = (prefix: string): IRequirePlugin => {
    return (module: string) => {
        return module.replace(prefix, '');
    };
};

let fileFormat = (format: string): IRequirePlugin => {
    let pluginPrefix = `${ format }!`;
    return (module: string) => {
        if (module.includes(pluginPrefix)) {
            return module.replace(pluginPrefix, '') + `.${ format }`;
        }
        return module;
    };
};

export let browser: IRequirePlugin = removePrefix('browser!');

export let optional: IRequirePlugin = removePrefix('optional!');

export let preload: IRequirePlugin = removePrefix('preload!');

export let json: IRequirePlugin = fileFormat('json');

export let css: IRequirePlugin = fileFormat('css');


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

export let ignoredPlugin = [
    browser, optional, preload
];

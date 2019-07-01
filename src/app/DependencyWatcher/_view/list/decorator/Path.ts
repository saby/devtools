// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_view/list/decorator/Path';

interface IConfig {
    path: string;
}

export default class Path extends Control {
    protected _template = template;
    protected _path: string;
    protected _beforeMount({ path }: Partial<IConfig>) {
        if (!path) {
            return;
        }
        this._path = (path.split(/\\|\//).pop() || '').replace(/\?.+/, '');
    }
    
}

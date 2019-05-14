// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_view/list/BackButton';
import { source, types } from "../../data";

type Options = {
    paths: string[];
    source: source.Abstract;
    id: string;
};
export default class BackButton extends Control {
    protected _template = template;
    protected _options: Options;
    private __caption: string;
    private __paths: string[] = [];
    private __currentId: string | void;
    private set __id(root: string | void) {
        this.__currentId = root;
        if (!root) {
            this.__paths.length = 0;
            return;
        }
        if (this.__paths.includes(root)) {
            this.__paths.length = this.__paths.indexOf(root);
            return;
        }
        this.__paths.push(root);
        
    }
    private get __id() {
        return this.__currentId;
    }
    private __onClick() {
        let paths = this.__paths;
        let id = paths[paths.length - 2];
        // @ts-ignore
        this._notify('change', [id]);
        this.__read(id, this._options.source);
    }
    protected _beforeUpdate(options: Options) {
        return this.__read(options.id, options.source);
    }
    protected _beforeMount(options: Options) {
        return this.__read(options.id, options.source);
    }
    private __read(id: string, source: source.Abstract) {
        if (this.__id == id) {
            return;
        }

        this.__id = id;

        if (!id) {
            delete this.__caption;
            return;
        }

        return source.read(id).then((item: types.ListItem) => {
            this.__caption = item.name;
        }).catch((error) => {
            this.__caption = id;
        }).then(() => {
            // @ts-ignore
            this._forceUpdate();
        });
    }
}

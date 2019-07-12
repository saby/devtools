// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_view/list/DataContainer';
import { source } from "../../data";
import { columns, Columns } from "./column";
import { getFilterItems } from "../filter";
import { headers, Headers } from "./header";

type Children = {
    listView: Control;
    notificationOpener: Control;
}

interface SourceConstructor {
    new(cfg: source.IConfig): source.Abstract;
}

interface IConfig {
    sourceConfig: source.IConfig;
    Source: SourceConstructor;
    navigation: object;
    modeController?: Control;
    itemTemplate?: Function;
    columns?: Columns;
    headers?: Headers;
}

export default class Main extends Control {
    protected _template = template;
    protected _children: Children;
    private __column: Columns;
    private __headers: Headers;
    private __sorting: {[key: string]: 'desc' | 'asc'}[] = [];
    private __navigation: object;
    private __source: source.Abstract;
    protected _filterItems: object[];
    constructor(cfg: IConfig) {
        super(cfg);
        this.__source = new cfg.Source(cfg.sourceConfig);
        this.__navigation = cfg.navigation;
        this.__column = cfg.columns || columns;
        this.__headers = cfg.headers || headers;
        this._filterItems = getFilterItems({
            /*fileSource: new source.File({
                rpc: cfg.sourceConfig.rpc
            })*/
        });
    }
    update(...args: unknown[]): void {
        if (this._children.listView) {
            this._children.listView.reload();
        }
    }
}

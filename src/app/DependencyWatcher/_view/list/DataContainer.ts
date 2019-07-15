// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_view/list/DataContainer';
import { source, types } from "../../data";
import { columns, Columns } from "./column";
import { getFilterItems } from "../filter";
import { headers, Headers } from "./header";
import { navigation } from "./navigation";
import { ItemAction, getItemActions, ItemActionNames } from "./getItemActions";
import { Model } from "Types/entity";
import { fileId, FilterItem } from "../filter/getFilterItems";

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
    protected _root?: string;
    private __column: Columns;
    private __headers: Headers;
    private __itemActions: ItemAction[];
    private __sorting: {[key: string]: 'desc' | 'asc'}[] = [];
    private __navigation: object;
    private __source: source.Abstract;
    protected _filterItems: FilterItem[];
    protected _filter: types.IFilterData = {};
    constructor(cfg: IConfig) {
        super(cfg);
        this.__source = new cfg.Source(cfg.sourceConfig);
        this.__navigation = cfg.navigation || navigation;
        this.__column = cfg.columns || columns;
        this.__headers = cfg.headers || headers;
        this._filterItems = getFilterItems({
            /*fileSource: new source.File({
                rpc: cfg.sourceConfig.rpc
            })*/
        });
        this.__itemActions = getItemActions({
            [ItemActionNames.fileId]: (model: Model) => {
                this.__setFilter({
                    parent: undefined,
                    fileId: model.get('fileId')
                });
                this._root = undefined;
                // fileId.value = model;
                // let items = getFilterItems({});
                // items.push(fileId);
                // this._filterItems = items;
            },
            [ItemActionNames.dependentOnFile]: (model: Model) => {
                this.__setFilter({
                    parent: undefined,
                    dependentOnFile: model.get('fileId')
                });
                this._root = undefined;
                // this._filterItems.push(fileId);
            }
        });
    }
    update(...args: unknown[]): void {
        if (this._children.listView) {
            this._children.listView.reload();
        }
    }
    private __setFilter(filter: Partial<types.IFilterData>) {
        const id = Math.random();
        this._filter = {
            ...filter,
            //@ts-ignore
            getVersion() {
                return id;
            }
        }
    }
}

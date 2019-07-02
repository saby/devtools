// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_view/list/DataContainer';
// @ts-ignore
import * as nameTemplate from 'wml!DependencyWatcher/_view/list/column/name';
// @ts-ignore
import * as pathTemplate from 'wml!DependencyWatcher/_view/list/column/path';
import SizeTemplate from 'DependencyWatcher/_view/list/column/Size';
import { source } from "../../data";
import { Columns } from "./column";

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
}

export default class Main extends Control {
    protected _template = template;
    protected _children: Children;
    private __column: Columns;
    private __sorting: {[key: string]: 'desc' | 'asc'}[] = [];
    private __navigation: object;
    private __source: source.Abstract;
    constructor(cfg: IConfig) {
        super(cfg);
        this.__source = new cfg.Source(cfg.sourceConfig);
        this.__navigation = cfg.navigation;
        this.__column = [
            {
                displayProperty: 'name',
                // template: ColumnTemplate
                template: cfg.itemTemplate || nameTemplate
            },
            {
                displayProperty: 'fileName',
                template: pathTemplate
            },
            {
                displayProperty: 'size',
                width: '100px',
                align: 'right',
                template: SizeTemplate
            }
        ];
    }
    private __filterObject: object = {};
    protected _filter: object = {};
    private get __filter() {
        return {
            ...this.__filterObject,
            ...this._filter
        }
    };
    private set __filter(value) {
        this.__filterObject = value;
    }
    update(...args: unknown[]): void {
        
        this._children.listView.reload();
    }
}

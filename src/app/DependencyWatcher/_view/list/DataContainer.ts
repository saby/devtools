// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_view/list/DataContainer';
import { source } from "../../data";
import { Columns } from "./column";
// @ts-ignore
import { ColumnTemplate } from "Controls/grid";

type Children = {
    list: Control;
}

interface SourceConstructor {
    new(cfg: source.IConfig): source.Abstract;
}

interface IConfig {
    sourceConfig: source.IConfig;
    Source: SourceConstructor;
    navigation: object;
    modeController?: Control;
    grouping<T>(item:T): string;
    itemTemplate?: Function;
}

export default class Main extends Control {
    protected _template = template;
    protected _children: Children;
    private __column: Columns;
    private __navigation: object;
    private __source: source.Abstract;
    constructor(cfg: IConfig) {
        super(cfg);
        this.__source = new cfg.Source(cfg.sourceConfig);
        this.__navigation = cfg.navigation;
        this.__column = [
            {
                title: 'module',
                displayProperty: 'name',
                template: cfg.itemTemplate || ColumnTemplate
            }
        ];
    }
    private _root: string| void;
    __changeRoot(event: unknown, id: string) {
        this._root = id;
    }
    private __filterObject: object = {};
    private get __filter() {
        return {
            root: this._root,
            ...this.__filterObject
        }
    };
    private set __filter(value) {
        this.__filterObject = value;
    }
    
    private __groupingCallback(item: unknown) {
        return viewConstants.hiddenGroup;
    }
}

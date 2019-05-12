// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_view/Main';
import { fastFilter, filterButton, source } from "../data";
import { getColumns } from "./getColumns";
import { ViewMode } from "../const";
import { contentChannel } from "../contentChannel";
import { RPC } from "Extension/Event/RPC";

type Children = {
    list: Control;
}

let createSource = (config: source.IConfig, viewMode: ViewMode) => {
    switch (viewMode) {
        case ViewMode.dependency: {
            return new source.Dependencies(config);
        }
        case ViewMode.dependent: {
            return new source.Dependent(config);
        }
    }
};

export default class Main extends Control {
    _markedKey = 1;
    _filter = { demo: 123 };
    _navigation = {
        source: 'page',
        view: 'page',
        sourceConfig: {
            pageSize: 50,
            page: 0
        }
    };
    
    protected _template = template;
    private _viewMode: ViewMode = ViewMode.dependency;
    private __fastFilterSource =  fastFilter;
    private __items = filterButton;
    protected _children: Children;
    private readonly __rpc: RPC = new RPC({
        channel: contentChannel
    });
    private __source = this.__getISource();
    // constructor(...args) {
    //     super(...args);
    // }
    private __getColumns() {
        return getColumns(this._viewMode);
    }
    protected destroy() {
        debugger;
    }
    private __changeView(event: unknown, mode: ViewMode) {
        if (this._viewMode == mode) {
            return;
        }
        this._viewMode = mode;
        this.__source = this.__getISource();
        // this._children.list._forceUpdate();
    }
    private __getISource() {
        let config = {
            rpc: this.__rpc
        };
        return createSource(config, this._viewMode);
    }
}

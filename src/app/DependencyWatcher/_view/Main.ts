// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_view/main/Main';
import { ViewMode } from "../const";
import { RPC } from "Extension/Event/RPC";
import { default as Dependency } from "./dependency/List";
import { default as Dependent } from "./dependent/List";
import 'css!DependencyWatcher/_view/main/Main';
import { IEventEmitter } from "Extension/Event/IEventEmitter";
import { EventNames, PLUGIN_NAME } from "Extension/Plugins/DependencyWatcher/const";
import { List } from "./list/List";
import { ContentChannel } from "../../Devtool/Event/ContentChannel";

let getList = (viewMode: ViewMode) => {
    switch (viewMode) {
        case ViewMode.dependency: {
            return Dependency;
        }
        case ViewMode.dependent: {
            return Dependent;
        }
    }
};

let getSourceConfig = (channel: IEventEmitter) => {
    return {
        rpc: new RPC({
            channel
        }),
        idProperty: 'id',
        parentProperty: 'parent'
    };
};

interface IChildren {
    listContainer: List;
}

export default class Main extends Control {
    protected readonly _template = template;
    protected readonly _children: IChildren;
    private __viewMode: ViewMode = ViewMode.dependency;
    private __list: Control = getList(this.__viewMode);
    private __channel: IEventEmitter = new ContentChannel(PLUGIN_NAME);
    constructor(...args: unknown[]) {
        super(...args);
        this.__addListener();
    }
    private __sourceConfig = getSourceConfig(this.__channel);
    private __changeView(event: unknown, mode: ViewMode) {
        if (this.__viewMode == mode) {
            return;
        }
        this.__viewMode = mode;
        this.__list = getList(mode);
    }
    private __addListener() {
        this.__onUpdateHandler = this.__onUpdate.bind(this);
        this.__channel.addListener(EventNames.update, this.__onUpdateHandler);
    }
    private __onUpdateHandler: () => void;
    private __onUpdate(...args: unknown[]) {
        this._children.listContainer.update(...args);
    }
    protected _beforeUnmount() {
        this.__channel.removeListener(EventNames.update, this.__onUpdateHandler);
        this.__channel.destructor();
        delete this.__channel;
    }
}

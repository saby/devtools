// @ts-ignore
import * as Control from 'Core/Control';
import DataContainer from "./DataContainer";
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_view/list/List';

export interface IListChildren {
    dataContainer: DataContainer;
}

export class List extends Control {
    protected _template = template;
    protected _children: IListChildren;
    update(...args: unknown[]): void {
        this._children.dataContainer.update(...args);
    }
}

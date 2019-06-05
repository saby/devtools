// @ts-ignore
import * as Control from 'Core/Control';
import DataContainer from "./DataContainer";

export interface IListChildren {
    dataContainer: DataContainer;
}

export interface IList extends Control {
    _children: IListChildren;
    update(): void;
}

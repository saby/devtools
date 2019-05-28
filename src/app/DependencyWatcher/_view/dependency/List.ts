// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_view/list/List';
import { source, types } from "DependencyWatcher/data";
// @ts-ignore
import * as itemTemplate from "wml!DependencyWatcher/_view/dependency/itemTemplate";

export default class List extends Control {
    protected _template = template;
    private __navigation = {};
    private __source = source.Dependencies;
    private __sourceOption: object;
    private __itemTemplate = itemTemplate;
}

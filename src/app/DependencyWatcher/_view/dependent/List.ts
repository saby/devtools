// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_view/list/List';
import { source, types } from "DependencyWatcher/data";
import { navigation } from "./navigation";

export default class List extends Control {
    protected _template = template;
    private __navigation = navigation;
    private __source = source.Dependent;
    private __sourceOption: object;
}

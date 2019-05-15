// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_view/list/List';
import { source, types, markers } from "../../data";
import { columns } from "./column";
import { grouping } from "../list/grouping";

export default class List extends Control {
    protected _template = template;
    private __column = columns;
    private __navigation = {};
    private __source = source.Dependencies;
    private __sourceOption: object;
    private __grouping = grouping
}

import { source } from "DependencyWatcher/data";
// @ts-ignore
import * as itemTemplate from "wml!DependencyWatcher/_view/dependency/itemTemplate";
import { List as ListControl } from "../list/List";

export default class List extends ListControl {
    private __navigation = {};
    private __source = source.Dependencies;
    private __sourceOption: object;
    private __itemTemplate = itemTemplate;
}

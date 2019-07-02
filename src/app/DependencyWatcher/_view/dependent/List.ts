import { source } from "DependencyWatcher/data";
import { navigation } from "./navigation";
import { List as ListControl } from "../list/List";
// @ts-ignore
import * as itemTemplate from "wml!DependencyWatcher/_view/dependent/itemTemplate";

export default class List extends ListControl {
    private __navigation = navigation;
    private __source = source.Dependent;
    private __sourceOption: object;
    private __itemTemplate = itemTemplate;
}

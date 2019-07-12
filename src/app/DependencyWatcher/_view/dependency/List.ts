import { source } from "DependencyWatcher/data";
import { List as ListControl } from "../list/List";
import { navigation } from "./navigation";

export default class List extends ListControl {
    private __navigation = navigation;
    private __source = source.Dependencies;
    private __sourceOption: object;
}

import { source } from "DependencyWatcher/data";
import { navigation } from "./navigation";
import { List as ListControl } from "../list/List";

export default class List extends ListControl {
    private __navigation = navigation;
    private __source = source.Dependent;
    private __sourceOption: object;
}

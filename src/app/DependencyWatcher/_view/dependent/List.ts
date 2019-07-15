import { source } from "DependencyWatcher/data";
import { List as ListControl } from "../list/List";

export default class List extends ListControl {
    private __source = source.Dependent;
}

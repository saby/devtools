// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_view/list/List';
import { markers, source, types } from "../../data";
import { columns } from "./column";
import { navigation } from "./navigation";
// @ts-ignore
import { view as viewConstants } from "Controls/Constants";
// @ts-ignore
import { Model } from "Types/entity";

export default class List extends Control {
    protected _template = template;
    private __column = columns;
    private __navigation = navigation;
    private __source = source.Dependent;
    private __sourceOption: object;
    private __grouping(item: Model<types.dependent.Item>) {
        let marker: types.IMarker[] = item.get('markers') || [];
        if (marker.includes(markers.dynamic)) {
            return 'dynamic'
        }
        return viewConstants.hiddenGroup;
    }
}

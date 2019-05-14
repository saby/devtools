// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_view/list/List';
import { source, types, markers } from "../../data";
import { columns } from "./column";
// @ts-ignore
import { Model } from 'Types/entity';
// @ts-ignore
import { view as viewConstants } from "Controls/Constants";

export default class List extends Control {
    protected _template = template;
    private __column = columns;
    private __navigation = {};
    private __source = source.Dependencies;
    private __sourceOption: object;
    private __grouping(item: Model<types.dependency.Item>) {
        let marker: types.IMarker[] = item.get('markers') || [];
        if (marker.includes(markers.notUsedBundleModule)) {
            return 'not used on this level'
        }
        if (marker.includes(markers.dynamic)) {
            return 'dynamic'
        }
        return viewConstants.hiddenGroup;
    }
}

import { source, types, markers } from "../../data";
// @ts-ignore
import { Model } from 'Types/entity';
// @ts-ignore
import { view as viewConstants } from "Controls/Constants";

export let grouping = <T extends types.ListItem>(item: Model<T>): string | void => {
    let itemMarkers: types.IMarker[] = item.get('markers') || [];
    if (itemMarkers.some((marker) => (marker.type === markers.notUsedBundleModule.type))) {
        return markers.notUsedBundleModule.type
    }
    if (itemMarkers.some((marker) => (marker.type === markers.dynamic.type))) {
        return markers.dynamic.type
    }
    return viewConstants.hiddenGroup;
};

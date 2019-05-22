import { types } from "../../data";
// @ts-ignore
import { Model } from 'Types/entity';
// @ts-ignore
import { view as viewConstants } from "Controls/Constants";
// @ts-ignore
import { rk } from 'Core/i18n';

export let grouping = <T extends types.ListItem>(item: Model<T>): string | void => {
    if (!item.get('parent')) {
        return viewConstants.hiddenGroup;
    }
    if (item.get('isDynamic')) {
        return rk('Динамические зависимости');
    }
    return viewConstants.hiddenGroup;
};

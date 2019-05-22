import { types } from "../../data";
// @ts-ignore
import { rk } from 'Core/i18n';
// @ts-ignore
import { Model } from 'Types/entity';
import { grouping as listGrouping } from "../list/grouping";

// @ts-ignore
export let grouping = <T extends types.dependency.Item>(item: Model<T>): string | void => {
    if (item.get('notUsed')) {
        return rk('Неиспользуемые, в данной цепочке зависимостей, модули файла');
    }
    return listGrouping(item);
};

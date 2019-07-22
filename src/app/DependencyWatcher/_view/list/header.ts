import { ListItem } from "../../_data/types";
// @ts-ignore
import { rk } from 'Core/i18n';

export interface IHeader<TItem extends ListItem = ListItem> {
    title: string;
    align?: string;
    sortingProperty?: keyof TItem;
}

export type Headers<TItem extends ListItem = ListItem> = Array<IHeader>

export const name: IHeader = {
     title: rk('name'),
    sortingProperty: "name"
};
export const fileName: IHeader = {
    title: rk('file'),
    sortingProperty: "fileName"
};
export const isDynamic: IHeader = {
    title: '',
    align: 'center'
};
export const initialized: IHeader = {
    title: rk('used'),
    align: 'center',
    sortingProperty: "initialized"
};
export const size: IHeader = {
    title: rk('size'),
    align: 'right',
    sortingProperty: "size"
};

export const headers: Headers = [
    name,
    fileName,
    isDynamic,
    initialized,
    size
];

// @ts-ignore
import { rk } from 'Core/i18n';
import { IListItem } from "../../data";

export interface IHeader<TItem extends IListItem = IListItem> {
    title: string;
    align?: string;
    sortingProperty?: keyof TItem | string;
}

export type Headers<TItem extends IListItem = IListItem> = Array<IHeader<TItem>>

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
export const used: IHeader = {
    title: rk('used'),
    align: 'center',
    sortingProperty: "used"
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
    used,
    size
];

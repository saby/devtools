// @ts-ignore
import { rk } from 'Core/i18n';
import { IListItem } from "../../data";
import { IHeader, IHeaders } from '../../interface/IHeaders';

export const name: IHeader<IListItem> = {
     title: rk('name'),
    sortingProperty: "name"
};
export const fileName: IHeader<IListItem> = {
    title: rk('file'),
    sortingProperty: "fileName"
};
export const isDynamic: IHeader<IListItem> = {
    title: '',
    align: 'center'
};
export const used: IHeader<IListItem> = {
    title: rk('used'),
    align: 'center',
    sortingProperty: "used"
};
export const size: IHeader<IListItem> = {
    title: rk('size'),
    align: 'right',
    sortingProperty: "size"
};

export const headers: IHeaders<IListItem> = [
    name,
    fileName,
    isDynamic,
    used,
    size
];

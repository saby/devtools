// @ts-ignore
import { rk } from 'Core/i18n';
import { IListItem } from '../data';
import { IHeader, IHeaders } from '../interface/IHeaders';

const name: IHeader<IListItem> = {
   title: rk('name'),
   sortingProperty: 'name'
};
const fileName: IHeader<IListItem> = {
   title: rk('file'),
   sortingProperty: 'fileName'
};
const isDynamic: IHeader<IListItem> = {
   title: '',
   align: 'center'
};
const used: IHeader<IListItem> = {
   title: rk('used'),
   align: 'center',
   sortingProperty: 'used'
};
const size: IHeader<IListItem> = {
   title: rk('size'),
   align: 'right',
   sortingProperty: 'size'
};

export const headers: IHeaders<IListItem> = [
   name,
   fileName,
   isDynamic,
   used,
   size
];

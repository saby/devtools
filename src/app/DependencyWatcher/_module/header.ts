/**
 * Headers for the main list of the "Dependencies" tab.
 * @author Зайцев А.С.
 */
import * as rk from 'i18n!DependencyWatcher';
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

export const headers: IHeaders<IListItem> = [
   name,
   fileName,
   isDynamic,
   used
];

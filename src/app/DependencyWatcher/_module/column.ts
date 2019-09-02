import SizeTemplate from './column/Size';
import { IListItem } from '../data';
import { IColumn } from '../interface/IColumn';
// @ts-ignore
import * as fileTemplate from 'wml!DependencyWatcher/_module/column/file';
// @ts-ignore
import * as usedTemplate from 'wml!DependencyWatcher/_module/column/used';
// @ts-ignore
import * as isDynamicTemplate from 'wml!DependencyWatcher/_module/column/isDynamic';

interface IListItemColumn extends IColumn<IListItem> {}

const name: Partial<IListItemColumn> = {
   displayProperty: 'name'
   // template: ColumnTemplate
   // template: cfg.itemTemplate || nameTemplate
};
const fileName: Partial<IListItemColumn> = {
   displayProperty: 'fileName',
   template: fileTemplate
};
const isDynamic: Partial<IListItemColumn> = {
   width: '30px',
   align: 'center',
   template: isDynamicTemplate
};
const used: Partial<IListItemColumn> = {
   width: '55px',
   align: 'center',
   template: usedTemplate
};
const size: Partial<IListItemColumn> = {
   displayProperty: 'size',
   width: '100px',
   align: 'right',
   template: SizeTemplate
};

export const columns: Array<Partial<IListItemColumn>> = [
   name,
   fileName,
   isDynamic,
   used,
   size
];

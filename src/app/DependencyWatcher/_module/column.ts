/**
 * Columns for the main list of the "Dependencies" tab.
 * @author Зайцев А.С.
 */
import FileTemplate from './column/File';
import { IColumn } from 'Controls/grid';
import usedTemplate = require('wml!DependencyWatcher/_module/column/used');
import isDynamicTemplate = require('wml!DependencyWatcher/_module/column/isDynamic');

const name: IColumn = {
   displayProperty: 'name',
   textOverflow: 'ellipsis'
};
const fileName: IColumn = {
   displayProperty: 'fileName',
   // TODO: https://online.sbis.ru/opendoc.html?guid=d6012884-47ab-4236-a186-8b46d15fd1b7
   // tslint:disable-next-line:ban-ts-ignore
   // @ts-ignore
   template: FileTemplate
};
const isDynamic: IColumn = {
   width: '30px',
   align: 'center',
   template: isDynamicTemplate
};
const used: IColumn = {
   width: '55px',
   align: 'center',
   valign: 'center',
   template: usedTemplate
};

export const columns: IColumn[] = [
   name,
   fileName,
   isDynamic,
   used
];

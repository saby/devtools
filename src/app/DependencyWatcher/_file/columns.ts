/**
 * Columns for the list in the filter panel of the "Dependencies" tab.
 * @author Зайцев А.С.
 */
import { IColumn } from 'Controls/grid';
import NameTemplate = require('wml!DependencyWatcher/_file/columns/name');
import ModulesTemplate = require('wml!DependencyWatcher/_file/columns/modules');

const name: IColumn = {
   displayProperty: 'name',
   template: NameTemplate
};

const modules: IColumn = {
   width: '55px',
   align: 'right',
   template: ModulesTemplate
};

export const columns: IColumn[] = [name, modules];

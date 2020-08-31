/**
 * Columns for the list in the filter panel of the "Dependencies" tab.
 * @author Зайцев А.С.
 */
import { ITransportFile } from 'Extension/Plugins/DependencyWatcher/IFile';
import { IColumn } from '../interface/IColumn';
import NameTemplate = require('wml!DependencyWatcher/_file/columns/name');
import ModulesTemplate = require('wml!DependencyWatcher/_file/columns/modules');

interface IFileColumn extends IColumn<ITransportFile> {}

const name: Partial<IFileColumn> = {
   displayProperty: 'name',
   template: NameTemplate
};

const modules: Partial<IFileColumn> = {
   width: '55px',
   align: 'right',
   template: ModulesTemplate
};

export const columns: Array<Partial<IFileColumn>> = [name, modules];

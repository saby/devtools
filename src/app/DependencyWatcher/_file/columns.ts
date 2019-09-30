import { ITransportFile } from 'Extension/Plugins/DependencyWatcher/IFile';
import { IColumn } from '../interface/IColumn';
// @ts-ignore
import * as NameTemplate from 'wml!DependencyWatcher/_file/columns/name';
// @ts-ignore
import * as ModulesTemplate from 'wml!DependencyWatcher/_file/columns/modules';

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

const size: Partial<IFileColumn> = {
   displayProperty: 'computedSize',
   width: '100px',
   align: 'right'
};

export const columns: Array<Partial<IFileColumn>> = [name, modules, size];

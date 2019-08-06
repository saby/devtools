import SizeTemplate from "./columns/Size";
import { ITransportFile } from 'Extension/Plugins/DependencyWatcher/IFile';
import { IColumn } from '../interface/IColumn';
// @ts-ignore
import * as UsedTemplate from 'wml!DependencyWatcher/_file/columns/used';
// @ts-ignore
import * as NameTemplate from 'wml!DependencyWatcher/_file/columns/name';
// @ts-ignore
import * as ModulesTemplate from 'wml!DependencyWatcher/_file/columns/modules';

interface IFileColumn extends IColumn<ITransportFile> {

}

export const name: Partial<IFileColumn> = {
     displayProperty: 'name',
     template: NameTemplate
};

export const modules: Partial<IFileColumn> = {
    width: '55px',
    align: 'right',
    template: ModulesTemplate
};

export const used: Partial<IFileColumn> = {
    width: '55px',
    align: 'center',
    template: UsedTemplate
};

export const size: Partial<IFileColumn> = {
    displayProperty: 'size',
    width: '100px',
    align: 'right',
    template: SizeTemplate
};

export const columns: Partial<IFileColumn>[] = [
    name,
    modules,
    // used,
    size
];

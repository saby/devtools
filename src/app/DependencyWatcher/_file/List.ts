// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_file/List';
import { navigation } from './navigation';
import { columns } from './columns';
import { headers } from './header';
import { ITransportFile } from 'Extension/Plugins/DependencyWatcher/IFile';
import { IHeaders } from '../interface/IHeaders';
import { IColumns } from '../interface/IColumn';

export class List extends Control {
    protected readonly _template = template;
    protected readonly _column: IColumns<ITransportFile> = columns;
    protected readonly _headers: IHeaders<ITransportFile> = headers;
    protected readonly _navigation = navigation;
    protected _sorting?: Partial<Record<keyof ITransportFile, "ASC" | "DESC">>[] = [ { size: "ASC" } ];
}

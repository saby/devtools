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

type Sorting = Partial<Record<keyof ITransportFile, "ASC" | "DESC">>[];
interface IConfig {
    columns: IColumns<ITransportFile>;
    headers:IHeaders<ITransportFile>;
    navigation: object;
    sorting: Sorting;
}

export class List extends Control {
    protected readonly _template = template;
    protected _column: IColumns<ITransportFile>;
    protected _headers: IHeaders<ITransportFile>;
    protected _navigation: object;
    protected _sorting?: Sorting;
    protected _beforeMount(config: Partial<IConfig>) {
        this._navigation = config.navigation || navigation;
        this._headers = config.headers || headers;
        this._column = config.columns || columns;
        this._sorting = config.sorting || [ { size: "ASC" } ];
    }
}
export default List;

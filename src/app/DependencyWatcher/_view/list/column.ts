import SizeTemplate from "./column/Size";
import { IListItem } from "../../data";
import { column } from 'DependencyWatcher/template';

export interface IColumn<TItem extends IListItem = IListItem> {
    displayProperty: keyof TItem;
    width: string;
    align: string;
    valign: string;
    stickyProperty: string;
    template: Function | string;
    resultTemplate: Function | string;
}

export type Columns<
    TItem extends IListItem = IListItem,
    TColumn extends IColumn<TItem> = IColumn<TItem>
> = Array<Partial<TColumn>>

export const name: Partial<IColumn> = {
     displayProperty: 'name',
     // template: ColumnTemplate
     // template: cfg.itemTemplate || nameTemplate
};
export const fileName: Partial<IColumn> = {
    displayProperty: 'fileName',
    template: column.file
};
export const isDynamic: Partial<IColumn> = {
    width: '30px',
    align: 'center',
    template: column.isDynamic
};
export const used: Partial<IColumn> = {
    width: '55px',
    align: 'center',
    template: column.used
};
export const size: Partial<IColumn> = {
    displayProperty: 'size',
    width: '100px',
    align: 'right',
    template: SizeTemplate
};

export const columns: Columns = [
    name,
    fileName,
    isDynamic,
    used,
    size
];

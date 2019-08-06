import SizeTemplate from "./column/Size";
import { IListItem } from "../../data";
import { column } from 'DependencyWatcher/template';
import { IColumn } from '../../interface/IColumn';

interface IListItemColumn extends IColumn<IListItem> {

}

export const name: Partial<IListItemColumn> = {
     displayProperty: 'name',
     // template: ColumnTemplate
     // template: cfg.itemTemplate || nameTemplate
};
export const fileName: Partial<IListItemColumn> = {
    displayProperty: 'fileName',
    template: column.file
};
export const isDynamic: Partial<IListItemColumn> = {
    width: '30px',
    align: 'center',
    template: column.isDynamic
};
export const used: Partial<IListItemColumn> = {
    width: '55px',
    align: 'center',
    template: column.used
};
export const size: Partial<IListItemColumn> = {
    displayProperty: 'size',
    width: '100px',
    align: 'right',
    template: SizeTemplate
};

export const columns: Partial<IListItemColumn>[] = [
    name,
    fileName,
    isDynamic,
    used,
    size
];

import { IDependencyTreeData, ListItem } from "../../interface/View";
import {
    columns as listColumn,
    Columns,
    IColumn as IListColumn
} from "../list/column";

export interface IColumn extends IListColumn<IDependencyTreeData> {

}

export const columns: Columns<IDependencyTreeData, IColumn> = [
    ...listColumn,
    // {
    //     displayProperty: 'unique'
    // },
    // {
    //     title: 'type',
    //     displayProperty: 'type',
    //     width: '100px'
    // },
];

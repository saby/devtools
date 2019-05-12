import { LeafType } from "../const";

interface ListItem {
    name: string;
    parent?: string;
    child: boolean | null;
    id: string;
}


export interface IDependencyTreeData extends ListItem {
    isDynamic?: boolean;
    type: LeafType;
    // unique?: boolean;
}

interface ListItemFile extends IDependencyTreeData {
    type: LeafType.file;
    child: true;
    // size: number;
}

interface LeafItemModule extends IDependencyTreeData {
    type: LeafType.module
}

export interface IDependentTreeData extends ListItem {

}

interface IFilterData {
    name?: string;
    parent?: string;
}

interface IOrderBy {

}

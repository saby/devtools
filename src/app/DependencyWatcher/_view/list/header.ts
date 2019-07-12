import { ListItem } from "../../_data/types";

export interface IHeader<TItem extends ListItem = ListItem> {
    title: string;
    align?: string;
    sortingProperty?: keyof TItem;
}

export type Headers<TItem extends ListItem = ListItem> = Array<IHeader>

export const name: IHeader = {
     title: 'name',
    sortingProperty: "name"
};
export const fileName: IHeader = {
    title: 'fileName',
    sortingProperty: "fileName"
};
export const isDynamic: IHeader = {
    title: '',
    align: 'center'
};
export const defined: IHeader = {
    title: 'defined',
    align: 'center',
    sortingProperty: "defined"
};
export const size: IHeader = {
    title: 'size',
    align: 'right',
    sortingProperty: "size"
};

export const headers: Headers = [
    name,
    fileName,
    isDynamic,
    defined,
    size
];

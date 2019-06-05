import { ListItem } from "../../_data/types";

export interface IColumn<TItem extends ListItem = ListItem> {
    title: string;
    displayProperty: keyof TItem;
    width: string;
    template: Function | string;
}

export type Columns<
    TItem extends ListItem = ListItem,
    TColumn extends IColumn<TItem> = IColumn<TItem>
> = Array<Partial<TColumn>>

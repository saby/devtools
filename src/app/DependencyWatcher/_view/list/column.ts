import { ListItem } from "../../interface/View";

/*

на шаблоне в MyTemplate могу получить доступ к опции следующим образом: {{colData.myOption}}

 */
export interface IColumn<TItem extends ListItem = ListItem> {
    title: string;
    displayProperty: keyof TItem;
    width: string;
    template: string;
}

export type Columns<
    TItem extends ListItem = ListItem,
    TColumn extends IColumn<TItem> = IColumn<TItem>
> = Array<Partial<TColumn>>

export const columns: Columns = [
    {
        title: 'Module',
        displayProperty: 'name'
    },
];

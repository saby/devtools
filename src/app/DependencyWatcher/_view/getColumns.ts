import { ViewMode } from "../const";
import { IDependencyTreeData, ListItem } from "../interface/View";

/*

на шаблоне в MyTemplate могу получить доступ к опции следующим образом: {{colData.myOption}}

 */
interface IColumn<TItem extends ListItem = ListItem> {
    title: string;
    displayProperty: keyof TItem;
    width: string;
    template: string;
}

type Columns<TItem extends ListItem = ListItem, TColumn extends IColumn<TItem> = IColumn<TItem>> = Array<Partial<TColumn>>

const COLUMN: Columns = [
    {
        title: 'Module',
        displayProperty: 'name'
    },
];

const LIST_COLUMNS = [
    ...COLUMN
];

interface IDependencyColumn extends IColumn<IDependencyTreeData> {

}
const DEPENDENT_COLUMNS: Columns = [
    ...COLUMN,
];

const DEPENDENCY_COLUMNS: Columns<IDependencyTreeData, IDependencyColumn> = [
    // {
    //     title: 'type',
    //     displayProperty: 'type',
    //     width: '100px'
    // },
    ...COLUMN,
    // {
    //     displayProperty: 'unique'
    // }
];


let getColumns = (mode: ViewMode) => {
    switch (mode) {
        case ViewMode.dependency: {
            return DEPENDENCY_COLUMNS;
        }
        case ViewMode.dependent: {
            return DEPENDENT_COLUMNS;
        }
        // case ViewMode.list: {
        //     return LIST_COLUMNS;
        // }
        default: {
            return LIST_COLUMNS;
        }
    }
};

export { getColumns };

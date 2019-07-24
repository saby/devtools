import { Model } from "Types/entity";

export enum ItemActionNames {
    file  = 'fileId',
    dependentOnFile = 'dependentOnFile',
    openSource = 'openSource'
}
interface ActionHandler {
    (model: Model): void;
}

enum ShowType {
    menu = 0,
    menuAndToolbar = 1,
    toolbar = 2,
}

export interface ItemAction {
    id: ItemActionNames; // Идентификатор операции.
    title: string; // Название операции.
    icon?: string; // Иконка операции.
    showType?: ShowType; // Местоположение операции. В свойство передается константа с соответствующим значением (0 - menu | 1 - toolbar and menu | 2 - toolbar). Если свойство не указано, то itemActions отображаются только в меню.
    style?: string; // Режим визуального отображения операции. (secondary | warning | danger | success).
    iconStyle?: 'secondary' | 'warning' | 'danger' | 'success'; // Режим визуального отображения иконки операции. (secondary | warning | danger | success).
    handler?: ActionHandler; // Обработчик операции.
    parent?: string; // Ключ родителя операции.
    "parent@"?: boolean | null; //  Поле, описывающее тип узла (список, узел, скрытый узел).
    visibilityCallback?(model: Model): boolean;
}

const openFile: ItemAction = {
    id: ItemActionNames.openSource,
    title: 'Перейти к файлу',
    showType: ShowType.menuAndToolbar,
    icon: "icon-Publish2",
    iconStyle: 'secondary',
    visibilityCallback(model: Model): boolean {
        return !!model.get('defined');
    }
};
const dependentOnFile: ItemAction = {
    id: ItemActionNames.dependentOnFile,
    title: 'Отобразить модули зависящие от файла',
    showType: ShowType.menu
};
const file: ItemAction = {
    id: ItemActionNames.file,
    title: 'Отобразить модули файла',
    showType: ShowType.menu
};

const ALL_ACTIONS: Map<ItemActionNames, ItemAction> = new Map([
    [ ItemActionNames.file, file ],
    [ ItemActionNames.dependentOnFile, dependentOnFile ],
    [ ItemActionNames.openSource, openFile ]
]);

export const getItemActions = (actions: Partial<Record<ItemActionNames, ActionHandler>>): ItemAction[] => {
    const result: ItemAction[] = [];
    for (const actionName in actions) {
        const item = ALL_ACTIONS.get(<ItemActionNames> actionName);
        if (!item) {
            continue;
        }
        result.push({
            ...item,
            handler: actions[<ItemActionNames> actionName]
        });
    }
    return result;
};

export const visibilityCallback = ({ id }: ItemAction, model: Model): boolean => {
    const item = ALL_ACTIONS.get(id);
    if (!item) {
        return true;
    }
    if (typeof item.visibilityCallback !== 'function') {
        return true
    }
    return item.visibilityCallback(model);
};

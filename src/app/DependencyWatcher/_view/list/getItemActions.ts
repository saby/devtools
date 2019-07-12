import { Model } from "Types/entity";

export enum ItemActionNames {
    fileId = 'fileId',
    dependentOnFile = 'dependentOnFile',
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
    id: string; // Идентификатор операции.
    title: string; // Название операции.
    icon?: string; // Иконка операции.
    showType?: ShowType; // Местоположение операции. В свойство передается константа с соответствующим значением (0 - menu | 1 - toolbar and menu | 2 - toolbar). Если свойство не указано, то itemActions отображаются только в меню.
    style?: string; // Режим визуального отображения операции. (secondary | warning | danger | success).
    iconStyle?: string; // Режим визуального отображения иконки операции. (secondary | warning | danger | success).
    handler?: ActionHandler; // Обработчик операции.
    parent?: string; // Ключ родителя операции.
    "parent@"?: boolean | null; //  Поле, описывающее тип узла (список, узел, скрытый узел).
}

const ALL_ACTIONS: Partial<Record<ItemActionNames, ItemAction>> = {
    [ItemActionNames.fileId]:          {
        id: 'fileId',
        title: 'Отобразить модули файла',
        showType: ShowType.menu
    },
    [ItemActionNames.dependentOnFile]: {
        id: 'dependentOnFile',
        title: 'Отобразить модули зависящие от файла',
        showType: ShowType.menu
    }
};

export const getItemActions = (actions: Partial<Record<ItemActionNames, ActionHandler>>): ItemAction[] => {
    const result: ItemAction[] = [];
    for (const actionName in actions) {
        const item = ALL_ACTIONS[<ItemActionNames> actionName];
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

/**
 * Item actions for the main list of the "Dependencies" tab.
 * @author Зайцев А.С.
 */
import * as rk from 'i18n!DependencyWatcher';
import { Model } from 'Types/entity';

export enum ItemActionNames {
   file = 'fileId',
   dependentOnFile = 'dependentOnFile',
   openSource = 'openSource'
}
type ActionHandler = (model: Model) => void;

enum ShowType {
   menu,
   menuAndToolbar,
   toolbar
}

export interface IItemAction {
   id: ItemActionNames;
   title: string;
   icon?: string;
   showType?: ShowType;
   style?: 'secondary' | 'warning' | 'danger' | 'success';
   iconStyle?: 'secondary' | 'warning' | 'danger' | 'success';
   handler?: ActionHandler;
   parent?: string;
   'parent@'?: boolean | null;
   visibilityCallback?(model: Model): boolean;
}

const dependentOnFile: IItemAction = {
   id: ItemActionNames.dependentOnFile,
   title: rk('Отобразить модули, зависящие от файла'),
   icon: 'icon-RelatedDocumentsUp',
   showType: ShowType.menu
};
const file: IItemAction = {
   id: ItemActionNames.file,
   title: rk('Отобразить модули файла'),
   icon: 'icon-RelatedDocumentsDown',
   showType: ShowType.menu
};

const ALL_ACTIONS: Map<ItemActionNames, IItemAction> = new Map([
   [ItemActionNames.file, file],
   [ItemActionNames.dependentOnFile, dependentOnFile]
]);

export const getItemActions = (
   actions: Partial<Record<ItemActionNames, ActionHandler>>
): IItemAction[] => {
   const result: IItemAction[] = [];
   for (const actionName in actions) {
      if (!actions.hasOwnProperty(actionName)) {
         continue;
      }
      const item = ALL_ACTIONS.get(actionName as ItemActionNames);
      if (!item) {
         continue;
      }
      result.push({
         ...item,
         handler: actions[actionName as ItemActionNames]
      });
   }
   return result;
};

import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
import { Memory } from 'Types/source';
import { adapter, Record as EntityRecord } from 'Types/entity';
import { Confirmation } from 'Controls/popup';
import { View as ListView } from 'Controls/list';
import {
   IItemAction,
   TItemActionShowType as ShowType
} from 'Controls/itemActions';
import {
   INavigationOptionValue,
   INavigationPageSourceConfig
} from 'Controls/interface';
import * as template from 'wml!Debugging/_view/View';
import { getArrayDifference } from 'Controls/Utils/ArraySimpleValuesUtil';
import Cookie = chrome.cookies.Cookie;
import Tab = chrome.tabs.Tab;
import CookieChangeInfo = chrome.cookies.CookieChangeInfo;

const AVAILABLE_COOKIE_SPACE = 4096;
const WS_CORE_MODULES = [
   'WS',
   'WS.Core',
   'Lib',
   'Ext',
   'WS.Deprecated',
   'Deprecated',
   'Helpers',
   'Transport',
   'Core'
];

interface IItem {
   id: string;
   title: string;
   isPinned: boolean;
}

/**
 * Controller of the "Debugging" tab.
 * Manages the s3debug cookie and forms data for lists.
 * @author Зайцев А.С.
 */
class View extends Control<IControlOptions, void[]> {
   protected _template: TemplateFunction = template;
   protected _hasUnsavedChanges: boolean = false;
   protected _unselectedSource: Memory;
   protected _selectedSource: Memory;
   protected _unselectedSearchValue: string = '';
   protected _selectedSearchValue: string = '';
   protected _sorting: object = [{ isPinned: 'DESC' }, { title: 'ASC' }];
   private unselectedModules: IItem[] = [];
   private selectedModules: IItem[] = [];
   protected _unselectedActions: IItemAction[] = [
      {
         id: 'pin',
         showType: ShowType.TOOLBAR,
         icon: 'icon-PinNull',
         handler: (item) => this.togglePin(item, true, 'unselected')
      },
      {
         id: 'unpin',
         showType: ShowType.TOOLBAR,
         icon: 'icon-PinOff',
         handler: (item) => this.togglePin(item, false, 'unselected')
      }
   ];
   protected _selectedActions: IItemAction[] = [
      {
         id: 'pin',
         showType: ShowType.TOOLBAR,
         icon: 'icon-PinNull',
         handler: (item) => this.togglePin(item, true, 'selected')
      },
      {
         id: 'unpin',
         showType: ShowType.TOOLBAR,
         icon: 'icon-PinOff',
         handler: (item) => this.togglePin(item, false, 'selected')
      }
   ];
   protected _children: {
      unselectedList: ListView;
      selectedList: ListView;
   };
   protected readonly _navigation: INavigationOptionValue<INavigationPageSourceConfig> = {
      source: 'page',
      view: 'infinity',
      sourceConfig: {
         pageSize: 50,
         page: 0,
         hasMore: false
      }
   };

   private existingModules: Set<string>;
   private pinnedModules: Set<string>;

   protected async _beforeMount(): Promise<void> {
      const [modules, url, pinnedModules]: [
         string[],
         string,
         string[]
      ] = await Promise.all([
         this.getModules(),
         this.getUrl(),
         this.getPinnedModules()
      ]);
      const cookieValue = await this.getCookieValue(url);

      this.pinnedModules = new Set(
         pinnedModules.filter((moduleName) =>
            this.existingModules.has(moduleName)
         )
      );

      if (cookieValue === 'true') {
         modules.forEach((value) => {
            this.selectedModules.push({
               id: value,
               title: value,
               isPinned: this.pinnedModules.has(value)
            });
         });
      } else {
         const selectedModulesSet = new Set(
            cookieValue.split(',').filter((value) => value.length !== 0)
         );

         modules.forEach((value) => {
            const newItem = {
               id: value,
               title: value,
               isPinned: this.pinnedModules.has(value)
            };
            if (selectedModulesSet.has(value)) {
               this.selectedModules.push(newItem);
            } else {
               this.unselectedModules.push(newItem);
            }
         });
      }

      this._unselectedSource = this.getMemory(this.unselectedModules);

      this._selectedSource = this.getMemory(this.selectedModules);

      this.onCookieChange = this.onCookieChange.bind(this);
      chrome.cookies.onChanged.addListener(this.onCookieChange);
   }

   protected _beforeUnmount(): void {
      chrome.cookies.onChanged.removeListener(this.onCookieChange);
   }

   protected _reloadPage(): void {
      this._hasUnsavedChanges = false;
      chrome.devtools.inspectedWindow.reload({});
   }

   protected _moveFavoriteItems(e: Event, newState: boolean): void {
      if (newState) {
         const newItems = new Set(this.pinnedModules);
         this.selectedModules.forEach((item) => {
            newItems.add(item.id);
         });
         this.setCookie(Array.from(newItems));
      } else {
         this.setCookie(
            this.selectedModules
               .filter((item) => !item.isPinned)
               .map(({ id }) => id)
         );
      }
   }

   protected _moveAllItems(e: Event, newState: boolean): void {
      if (newState) {
         this.setCookie(['true']);
      } else {
         this.setCookie([]);
      }
   }

   protected _itemActionVisibilityCallback(
      action: IItemAction,
      item: EntityRecord
   ): boolean {
      switch (action.id) {
         case 'pin':
            return !item.get('isPinned');
         case 'unpin':
            return item.get('isPinned');
         default:
            return true;
      }
   }

   protected async _changeCookie(
      e: Event,
      action: 'add' | 'delete',
      item: EntityRecord
   ): Promise<void> {
      const itemKey = item.get('id');
      let items;
      if (WS_CORE_MODULES.includes(itemKey)) {
         items = WS_CORE_MODULES.filter((module) =>
            this.existingModules.has(module)
         );
      } else {
         items = [itemKey];
      }

      const url = await this.getUrl();
      const cookieValue = await this.getCookieValue(url);
      const newModules = new Set(
         cookieValue.split(',').filter((value) => value.length !== 0)
      );
      items.forEach((id) => newModules[action](id));

      await this.setCookie(Array.from(newModules));
   }

   private async setCookie(modules: string[]): Promise<void> {
      const url = await this.getUrl();

      if (modules.length !== 0) {
         const availableSpace = await this.getAvailableCookieSpace(url);
         if (availableSpace === 0) {
            return View.openPopup();
         }

         let currentSize = 0;

         for (let i = 0; i < modules.length; i++) {
            const value = modules[i];
            const length = i === 0 ? value.length : value.length + 1; // + 1 is used to account for ,

            if (currentSize + length <= availableSpace) {
               currentSize += length;
            } else {
               return View.openPopup();
            }
         }

         chrome.cookies.set({
            name: 's3debug',
            url,
            value: modules.join(',')
         });
      } else {
         chrome.cookies.remove({
            name: 's3debug',
            url
         });
      }
   }

   private async onCookieChange(changeInfo: CookieChangeInfo): Promise<void> {
      if (changeInfo.cookie.name !== 's3debug') {
         return;
      }
      this._hasUnsavedChanges = true;
      if (changeInfo.removed) {
         if (
            this.selectedModules.length === 0 ||
            changeInfo.cause === 'overwrite'
         ) {
            return;
         }
         const unselectedItemsNames: string[] =
            changeInfo.cookie.value === 'true'
               ? this.selectedModules.map(({ id }) => id)
               : changeInfo.cookie.value.split(',');

         this.selectedModules.forEach((item) => {
            this.unselectedModules.push(item);
         });
         this.selectedModules = [];

         await this.moveItemsInSource(
            this._selectedSource,
            this._unselectedSource,
            unselectedItemsNames
         );

         await Promise.all([
            this._children.unselectedList.reload(),
            this._children.selectedList.reload()
         ]);
      } else {
         const newValue = changeInfo.cookie.value;

         if (newValue === 'true') {
            this.selectedModules = this.unselectedModules.concat(
               this.selectedModules
            );
            this.unselectedModules = [];
            this._unselectedSource = this.getMemory(this.unselectedModules);
            this._selectedSource = this.getMemory(this.selectedModules);
         } else {
            const newSelectedModules = newValue
               .split(',')
               .filter((value) => value.length !== 0);

            const currentSelectedModules: IItem['id'][] = this.selectedModules.map(
               ({ id }) => id
            );

            const diff = getArrayDifference(
               currentSelectedModules,
               newSelectedModules
            );

            this.moveItemsInArrays(
               this.unselectedModules,
               this.selectedModules,
               diff.added
            );
            this.moveItemsInArrays(
               this.selectedModules,
               this.unselectedModules,
               diff.removed
            );

            const operations = [];

            operations.push(
               this.moveItemsInSource(
                  this._unselectedSource,
                  this._selectedSource,
                  diff.added
               )
            );

            operations.push(
               this.moveItemsInSource(
                  this._selectedSource,
                  this._unselectedSource,
                  diff.removed
               )
            );

            await Promise.all(operations);

            await Promise.all([
               this._children.unselectedList.reload(),
               this._children.selectedList.reload()
            ]);
         }
      }
   }

   private async moveItemsInSource(
      sourceSource: Memory,
      targetSource: Memory,
      ids: IItem['id'][]
   ): Promise<void> {
      const operations = ids.map((elem) =>
         targetSource.update(
            new EntityRecord({
               rawData: {
                  id: elem,
                  title: elem,
                  isPinned: this.pinnedModules.has(elem)
               }
            })
         )
      );
      operations.push(sourceSource.destroy(ids));
      await Promise.all(operations);
   }

   private moveItemsInArrays(
      source: IItem[],
      target: IItem[],
      ids: IItem['id'][]
   ): void {
      ids.forEach((id) => {
         const itemIndex = source.findIndex(
            (sourceItem) => sourceItem.id === id
         );
         if (itemIndex !== -1) {
            target.push(source[itemIndex]);
            source.splice(itemIndex, 1);
         }
      });
   }

   private getMemory(items: IItem[]): Memory {
      return new Memory({
         keyProperty: 'id',
         data: items.slice(),
         filter: View.sourceFilter
      });
   }

   private getUrl(): Promise<string> {
      return new Promise((resolve) => {
         chrome.tabs.get(chrome.devtools.inspectedWindow.tabId, (tab: Tab) => {
            resolve(new URL(tab.url as string).origin);
         });
      });
   }

   private getCookieValue(url: string): Promise<string> {
      return new Promise((resolve) => {
         chrome.cookies.get(
            {
               name: 's3debug',
               url
            },
            (cookie: Cookie | null) => {
               resolve(cookie ? cookie.value : '');
            }
         );
      });
   }

   private getModules(): Promise<string[]> {
      return new Promise((resolve) => {
         chrome.devtools.inspectedWindow.eval(
            'contents ? Object.keys(contents.modules) : []',
            (result: string[]) => {
               this.existingModules = new Set(result);
               resolve(result);
            }
         );
      });
   }

   private getAvailableCookieSpace(url: string): Promise<number> {
      return new Promise((resolve) => {
         chrome.cookies.getAll(
            {
               url
            },
            (cookies: Cookie[]) => {
               const occupiedSpace = cookies.reduce((acc, cookie) => {
                  if (cookie.name === 's3debug') {
                     return acc;
                  } else {
                     return acc + cookie.value.length + cookie.name.length;
                  }
               }, 0);
               resolve(Math.max(AVAILABLE_COOKIE_SPACE - occupiedSpace, 0));
            }
         );
      });
   }

   private async getPinnedModules(): Promise<string[]> {
      return new Promise((resolve) => {
         chrome.storage.sync.get(
            'debuggingPinnedModules',
            (result: { debuggingPinnedModules?: string[] }) => {
               resolve(result.debuggingPinnedModules || []);
            }
         );
      });
   }

   private togglePin(
      item: EntityRecord,
      state: boolean,
      currentList: 'selected' | 'unselected'
   ): void {
      const newItem = item.clone();
      const id = item.get('id');
      const source =
         currentList === 'selected'
            ? this._selectedSource
            : this._unselectedSource;
      const list =
         currentList === 'selected'
            ? this._children.selectedList
            : this._children.unselectedList;
      const modulesArray =
         currentList === 'selected'
            ? this.selectedModules
            : this.unselectedModules;
      const itemInArray = modulesArray.find((elem) => elem.id === id) as IItem;
      newItem.set('isPinned', state);
      itemInArray.isPinned = state;
      source.update(newItem).then(() => {
         list.reload();
      });
      if (state) {
         this.pinnedModules.add(id);
      } else {
         this.pinnedModules.delete(id);
      }
      chrome.storage.sync.set({
         debuggingPinnedModules: Array.from(this.pinnedModules)
      });
   }

   static _theme: string[] = ['Debugging/debugging'];

   private static openPopup(): Promise<void> {
      return Confirmation.openPopup({
         type: 'ok',
         style: 'danger',
         details:
            'The resulting cookie will be too large and very likely will crash the page.\n' +
            'Consider selecting fewer modules or removing some cookies to make space.'
      });
   }

   private static sourceFilter(
      item: adapter.IRecord,
      where: {
         title?: string;
      }
   ): boolean {
      if (!where.title) {
         return true;
      } else {
         return item
            .get('title')
            .toLowerCase()
            .includes(where.title.toLowerCase());
      }
   }
}

export default View;

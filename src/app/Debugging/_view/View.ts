import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
import { Memory } from 'Types/source';
import { adapter, Record } from 'Types/entity';
import { RecordSet } from 'Types/collection';
import { Confirmation } from 'Controls/popup';
import { View as ListView } from 'Controls/list';
import template = require('wml!Debugging/_view/View');
import Cookie = chrome.cookies.Cookie;
import Tab = chrome.tabs.Tab;

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
}

const enum ShowType {
   MENU,
   MENU_TOOLBAR,
   TOOLBAR
}

/**
 * Controller of the "Debugging" tab.
 * Manages the s3debug cookie and forms data for lists.
 * @author Зайцев А.С.
 */
class View extends Control<IControlOptions, void[]> {
   protected _template: TemplateFunction = template;
   protected _unselectedSource: Memory;
   protected _selectedSource: Memory;
   protected _unselectedSearchValue: string = '';
   protected _selectedSearchValue: string = '';
   protected _sorting: object = [{ title: 'ASC' }];
   protected _selectedItems: RecordSet;
   protected _selectedItemsReadyCallback: (items: RecordSet) => void;
   protected _existingModules: Set<string>;
   protected _unselectedActions: object[] = [
      {
         id: 'moveLeft',
         showType: ShowType.TOOLBAR,
         icon: 'icon-DayForward',
         handler: (item: Record) =>
            this.moveItems(item, this._unselectedSource, this._selectedSource)
      }
   ];
   protected _selectedActions: object[] = [
      {
         id: 'moveRight',
         showType: ShowType.TOOLBAR,
         icon: 'icon-DayBackward',
         handler: (item: Record) =>
            this.moveItems(item, this._selectedSource, this._unselectedSource)
      }
   ];
   protected _children: {
      unselectedList: ListView;
      selectedList: ListView;
   };

   protected async _beforeMount(): Promise<void> {
      this._selectedItemsReadyCallback = (items) => {
         this._selectedItems = items;
      };
      const [modules, url]: [string[], string] = await Promise.all([
         this.getModules(),
         this.getUrl()
      ]);
      const cookieValue = await this.getCookieValue(url);
      const selectedModules: IItem[] = [];
      const unselectedModules: IItem[] = [];

      if (cookieValue === 'true') {
         modules.forEach((value) => {
            selectedModules.push({
               id: value,
               title: value
            });
         });
      } else {
         const selectedModulesSet = new Set(
            cookieValue.split(',').filter((value) => value.length !== 0)
         );

         modules.forEach((value) => {
            const newItem = {
               id: value,
               title: value
            };
            if (selectedModulesSet.has(value)) {
               selectedModules.push(newItem);
            } else {
               unselectedModules.push(newItem);
            }
         });
      }

      this._unselectedSource = new Memory({
         keyProperty: 'id',
         data: unselectedModules,
         filter: View.sourceFilter
      });

      this._selectedSource = new Memory({
         keyProperty: 'id',
         data: selectedModules,
         filter: View.sourceFilter
      });
   }

   protected async _applyChanges(): Promise<void> {
      const url = await this.getUrl();
      const selectedKeys = this._selectedItems
         .getRawData()
         .map((elem: { id: string }) => elem.id);
      if (selectedKeys.length) {
         const availableSpace = await this.getAvailableCookieSpace(url);
         if (availableSpace === 0) {
            return View.openPopup();
         }

         let currentSize = 0;

         for (let i = 0; i < selectedKeys.length; i++) {
            const value = selectedKeys[i];
            const length = i === 0 ? value.length : value.length + 1;

            if (currentSize + length <= availableSpace) {
               currentSize += length;
            } else {
               return View.openPopup();
            }
         }

         chrome.cookies.set(
            {
               name: 's3debug',
               url,
               value: selectedKeys.join(',')
            },
            chrome.devtools.inspectedWindow.reload
         );
      } else {
         chrome.cookies.remove(
            {
               name: 's3debug',
               url
            },
            chrome.devtools.inspectedWindow.reload
         );
      }
   }

   protected async _resetCookie(): Promise<void> {
      const url = await this.getUrl();
      chrome.cookies.remove(
         {
            name: 's3debug',
            url
         },
         chrome.devtools.inspectedWindow.reload
      );
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
               this._existingModules = new Set(result);
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

   private async moveItems(
      item: Record,
      sourceSource: Memory,
      targetSource: Memory
   ): Promise<void> {
      const itemKey = item.get('id');
      let items;
      if (WS_CORE_MODULES.includes(itemKey)) {
         items = WS_CORE_MODULES.filter((module) =>
            this._existingModules.has(module)
         );
      } else {
         items = [itemKey];
      }
      await sourceSource.destroy(items);
      await Promise.all(
         items.map((elem) =>
            targetSource.update(
               new Record({
                  rawData: {
                     id: elem,
                     title: elem
                  }
               })
            )
         )
      );
      this._children.unselectedList.reload();
      this._children.selectedList.reload();
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

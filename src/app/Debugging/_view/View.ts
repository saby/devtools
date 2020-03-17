import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
import { Memory } from 'Types/source';
import { adapter } from 'Types/entity';
import { Confirmation } from 'Controls/popup';
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

class View extends Control<IControlOptions, void[]> {
   protected _template: TemplateFunction = template;
   protected _source: Memory;
   protected _selectedKeys: string[];
   protected _searchValue: string = '';
   protected _sorting: object = [{ title: 'ASC' }];

   protected async _beforeMount(): Promise<void> {
      const [modules, url]: [string[], string] = await Promise.all([
         this.getModules(),
         this.getUrl()
      ]);
      const cookieValue = await this.getCookieValue(url);

      if (cookieValue === 'true') {
         this._selectedKeys = modules.slice();
      } else {
         this._selectedKeys = cookieValue
            .split(',')
            .filter((value) => value.length !== 0);
      }
   }

   protected _onSelectedKeysChanged(
      e: Event,
      keys: string[],
      added: string[],
      removed: string[]
   ): void {
      if (keys === this._selectedKeys) {
         return;
      }
      if (added.some((itemID) => WS_CORE_MODULES.includes(itemID))) {
         const newKeys = new Set(keys);
         WS_CORE_MODULES.forEach((module) => {
            newKeys.add(module);
         });
         this._selectedKeys = Array.from(newKeys);
      } else if (removed.some((itemID) => WS_CORE_MODULES.includes(itemID))) {
         const newKeys = new Set(keys);
         WS_CORE_MODULES.forEach((module) => {
            newKeys.delete(module);
         });
         this._selectedKeys = Array.from(newKeys);
      } else {
         this._selectedKeys = keys;
      }
   }

   protected async _applyChanges(): Promise<void> {
      const url = await this.getUrl();
      if (this._selectedKeys.length) {
         const availableSpace = await this.getAvailableCookieSpace(url);
         if (availableSpace === 0) {
            return View.openPopup();
         }

         let currentSize = 0;

         for (let i = 0; i < this._selectedKeys.length; i++) {
            const value = this._selectedKeys[i];
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
               value: this._selectedKeys.join(',')
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
               this._source = new Memory({
                  keyProperty: 'id',
                  data: result.map((value) => {
                     return {
                        id: value,
                        title: value
                     };
                  }),
                  filter: View.sourceFilter
               });
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

import { FocusFromLib, IElementFinder } from 'Extension/Plugins/Focus/Focus';

interface IFocusLib {
   ElementFinder: IElementFinder;
   focus: FocusFromLib;
}

const LOAD_CHECK_INTERVAL = 500;

function loadFocusLib(): Promise<IFocusLib> {
   return new Promise((resolve, reject) => {
      window.require(['UI/Focus'], (result?: IFocusLib) => {
         if (result) {
            resolve(result);
         } else {
            reject("Can't find the UI/Focus library.");
         }
      });
   });
}

/**
 * Loads modules from UI/Focus and caches the entire library.
 * @author Зайцев А.С.
 */
export class FocusLibLoader {
   private focusLib?: IFocusLib;
   private loadInterval?: number;

   getElementFinder(): Promise<IElementFinder> {
      return this.getFromLib('ElementFinder');
   }

   getFocusFromLib(): Promise<FocusFromLib> {
      return this.getFromLib('focus');
   }

   private async getFromLib<T extends keyof IFocusLib>(
      module: T
   ): Promise<IFocusLib[T]> {
      if (this.focusLib) {
         return Promise.resolve(this.focusLib[module]);
      }
      return new Promise(async (resolve) => {
         if (window.__WASABY_DEV_HOOK__._$hasWasaby) {
            this.focusLib = await loadFocusLib();
            resolve(this.focusLib[module]);
         } else {
            // TODO: use events
            if (this.loadInterval) {
               clearInterval(this.loadInterval);
            }
            this.loadInterval = window.setInterval(async () => {
               if (window.__WASABY_DEV_HOOK__._$hasWasaby) {
                  this.focusLib = await loadFocusLib();
                  clearInterval(this.loadInterval);
                  this.loadInterval = undefined;
                  resolve(this.focusLib[module]);
               }
            }, LOAD_CHECK_INTERVAL);
         }
      });
   }
}

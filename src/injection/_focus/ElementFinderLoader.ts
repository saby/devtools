import { IElementFinder } from 'Extension/Plugins/Focus/Focus';

const LOAD_CHECK_INTERVAL = 500;

function loadElementFinder(): Promise<IElementFinder> {
   return new Promise((resolve, reject) => {
      window.require(
         ['UI/Focus'],
         (result?: { ElementFinder?: IElementFinder }) => {
            if (result && result.ElementFinder) {
               resolve(result.ElementFinder);
            } else {
               reject("Can't find the ElementFinder");
            }
         }
      );
   });
}

/**
 * Loads UI/Focus:ElementFinder and caches it.
 * @author Зайцев А.С.
 */
export class ElementFinderLoader {
   private elementFinder?: IElementFinder;
   private loadInterval?: number;
   async getElementFinder(): Promise<IElementFinder> {
      if (this.elementFinder) {
         return Promise.resolve(this.elementFinder);
      }
      return new Promise(async (resolve) => {
         if (window.__WASABY_DEV_HOOK__._$hasWasaby) {
            this.elementFinder = await loadElementFinder();
            resolve(this.elementFinder);
         } else {
            // TODO: use events
            if (this.loadInterval) {
               clearInterval(this.loadInterval);
            }
            this.loadInterval = window.setInterval(async () => {
               if (window.__WASABY_DEV_HOOK__._$hasWasaby) {
                  this.elementFinder = await loadElementFinder();
                  clearInterval(this.loadInterval);
                  this.loadInterval = undefined;
                  resolve(this.elementFinder);
               }
            }, LOAD_CHECK_INTERVAL);
         }
      });
   }
}

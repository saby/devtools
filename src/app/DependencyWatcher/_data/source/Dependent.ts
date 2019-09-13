import { IDependencies } from 'Extension/Plugins/DependencyWatcher/IModule';
import { ListAbstract } from './ListAbstract';
import { ITransferRPCModule } from 'Extension/Plugins/DependencyWatcher/IRPCModule';

export class Dependent extends ListAbstract {

   private _pageName: string;
   protected _getChildren(item: ITransferRPCModule): IDependencies<number[]> {
      return item.dependent;
   }
   private __getPageName(): Promise<string> {
      if (this._pageName) {
         return Promise.resolve(this._pageName);
      }
      const DEFAULT = 'page';
      return new Promise<string>((resolve) => {
         const timer = setTimeout(resolve, 1000, DEFAULT);
         chrome.tabs.get(
            chrome.devtools.inspectedWindow.tabId,
            (tab: chrome.tabs.Tab) => {
               resolve(tab.url || DEFAULT);
               clearTimeout(timer);
            }
         );
      }).then((name: string) => {
         this._pageName = name;
         return name;
      });
   }
}

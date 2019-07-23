import { IDependencies } from "Extension/Plugins/DependencyWatcher/IModule";
import { ListAbstract } from "./ListAbstract";
import { ITransferItem } from "Extension/Plugins/DependencyWatcher/IItem";

export class Dependent extends ListAbstract {
    protected _getChildren(item: ITransferItem): IDependencies<number[]> {
        return item.dependent;
    }
    
    private __pageName: string;
    private __getPageName(): Promise<string> {
        if (this.__pageName) {
            return Promise.resolve(this.__pageName);
        }
        const DEFAULT = 'page';
        return new Promise<string>((resolve, reject) => {
            let timer = setTimeout(resolve, 1000, DEFAULT);
            chrome.tabs.get(chrome.devtools.inspectedWindow.tabId, (tab: chrome.tabs.Tab) => {
                resolve(tab.url || DEFAULT);
                clearTimeout(timer);
            });
        }).then((name: string) => {
            this.__pageName = name;
            return name;
        });
    }
}

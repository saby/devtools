import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
import * as template from 'wml!Devtool/Page/Page';
import { Memory } from 'Types/source';
import { ContentChannel } from 'Devtool/Event/ContentChannel';
import { GlobalMessages } from 'Extension/const';
import { ConsoleLogger } from 'Extension/Logger/Console';
import { Store } from 'Elements/elements';
import {
   DEFAULT_EXTENSION_OPTIONS,
   IExtensionOptions,
   loadOptions
} from 'Extension/Utils/loadOptions';
import { hasChangedTabs } from 'Extension/Utils/hasChangedTabs';
import 'css!Controls/Application/oldCss'; // TODO: пока не подключили application берём шрифты отсюда
import 'css!Controls/application';
import 'css!Devtool/Page/Page';

type VisibilityCallback = (visibility: boolean) => void;

const logger = new ConsoleLogger('Wasaby');
class Extension extends Control {
   protected _template: TemplateFunction = template;
   protected _activeTab: string = 'Elements';
   protected _tabsSource: Memory;
   protected _channel: ContentChannel = new ContentChannel('globalChannel');
   protected _hasWasabyOnPage: boolean = false;
   protected _hasChangedTabs: boolean = false;
   protected _store?: Store;
   protected _tabChanged: boolean = false;
   protected _rootKey: number = 0;
   protected _listenersToVisibility: Set<VisibilityCallback> = new Set();

   panelShownCallback(): void {
      this._listenersToVisibility.forEach((callback) => {
         callback(true);
      });
   }

   panelHiddenCallback(): void {
      this._listenersToVisibility.forEach((callback) => {
         callback(false);
      });
   }

   protected async _beforeMount(options: IControlOptions): Promise<void> {
      logger.log('сообщаем странице об активности вкладки');
      this._channel.dispatch(GlobalMessages.devtoolsInitialized);
      this._channel.addListener(GlobalMessages.wasabyInitialized, () => {
         logger.log('получили ответ от вкладки');
         this._hasWasabyOnPage = true;
         this._initState();
      });

      chrome.devtools.network.onNavigated.addListener(async () => {
         logger.log('получили нативное событие смены адреса страницы');
         this._hasWasabyOnPage = false;
         if (this._hasChangedTabs) {
            await this.loadTabs();
         }
         this._hasChangedTabs = false;
         this.destroyStore();
         this._tabChanged = true;
      });

      this._hasChangedTabs = await hasChangedTabsOnPage();
      if (!this._hasChangedTabs) {
         await this.loadTabs();
      }

      this.onTabsChanged = this.onTabsChanged.bind(this);
      chrome.storage.onChanged.addListener(this.onTabsChanged);

      window.devtoolsPanel = this;
   }

   protected _beforeUpdate(): void {
      if (this._tabChanged) {
         this._tabChanged = false;
         this._rootKey++;
         this._initState();
      }
   }

   protected _beforeUnmount(): void {
      // unmount of this control never happens in this version, but this makes it future-proof
      this._listenersToVisibility.clear();
      window.devtoolsPanel = undefined;
   }

   protected _initState(): void {
      if (!this._tabChanged && this._hasWasabyOnPage) {
         this._store = new Store();
      }
   }

   protected _openOptionsPage(): void {
      chrome.runtime.openOptionsPage();
   }

   protected _reloadPage(): void {
      chrome.devtools.inspectedWindow.reload({});
   }

   protected _subToPanelVisibility(
      e: Event,
      callback: VisibilityCallback
   ): void {
      this._listenersToVisibility.add(callback);
   }

   protected _unsubFromPanelVisibility(
      e: Event,
      callback: VisibilityCallback
   ): void {
      this._listenersToVisibility.delete(callback);
   }

   private onTabsChanged(changes: object, areaName: string): void {
      if (areaName === 'sync' && hasChangedTabs(changes)) {
         this._hasChangedTabs = true;
         this.destroyStore();
      }
   }

   private destroyStore(): void {
      if (this._store) {
         this._store.destructor();
         this._store = undefined;
      }
   }

   private async loadTabs(): Promise<void> {
      const { tabs }: IExtensionOptions = await loadOptions(['tabs']);
      const sortedTabs = getTabsInCanonicalOrder(tabs);
      this._activeTab = sortedTabs[0];
      this._tabsSource = getSource(sortedTabs);
   }

   static _styles: string[] = ['Controls/dragnDrop'];
}

export default Extension;

function getTabsInCanonicalOrder(
   tabs: IExtensionOptions['tabs']
): IExtensionOptions['tabs'] {
   return DEFAULT_EXTENSION_OPTIONS.tabs.filter((tabName) =>
      tabs.includes(tabName)
   );
}

function getSource(tabs: IExtensionOptions['tabs']): Memory {
   return new Memory({
      keyProperty: 'key',
      data: tabs.map((tabName) => {
         return {
            key: tabName,
            title: tabName,
            align: 'left'
         };
      })
   });
}

function hasChangedTabsOnPage(): Promise<boolean> {
   return new Promise((resolve) => {
      chrome.devtools.inspectedWindow.eval(
         '!!window.__WASABY_DEV_HOOK__ && !!window.__WASABY_DEV_HOOK__._$hasChangedTabs',
         (changedTabs: boolean) => {
            resolve(changedTabs);
         }
      );
   });
}

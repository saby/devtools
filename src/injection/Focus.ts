import { IPlugin, IPluginConfig } from './IPlugin';
import { IEventEmitter } from 'Extension/Event/IEventEmitter';
import Highlighter from './_hook/Highlighter';
import getId from './_focus/getId';
import { getGlobalChannel } from './_devtool/globalChannel';
import { GlobalMessages } from 'Extension/const';
import { RemovalObserver } from './_focus/RemovalObserver';
import { throttle } from 'Extension/Utils/throttle';
import {
   IBackendItem,
   IElementFinder,
   IHistoryItem
} from 'Extension/Plugins/Focus/Focus';
import { IWasabyElement } from 'Extension/Plugins/Elements/IControlNode';
import { FocusLibLoader } from './_focus/FocusLibLoader';
import { getFullFocusTree } from './_focus/getFullFocusTree';
import { getCaption } from './_focus/getCaption';

const TREE_UPDATE_FREQUENCY = 1000;

export class Focus implements IPlugin {
   private channel: IEventEmitter;
   private mutationObserver: MutationObserver;
   private removalObserver: RemovalObserver = new RemovalObserver();
   private items: Map<Node, IBackendItem> = new Map();
   private historyItems: Map<Node, IHistoryItem> = new Map();
   private focusLibLoader: FocusLibLoader = new FocusLibLoader();
   private pluginInitialized: boolean = false;
   private elementFinder: IElementFinder;
   private highlighter: Highlighter = new Highlighter({
      onSelect: () => {
         // we don't need to do anything on select for now
      }
   });
   /*
    * People don't care about intermediate states of the DOM tree, so in order to reduce the performance impact
    * we generate the new tree once per second at most.
    * So we use the mutation observer to catch any changes of the DOM tree, but the actual work happens in its own task.
    */
   private throttledConstructTree: () => void;

   constructor({ channel }: IPluginConfig) {
      this.channel = channel;
      this.removalCallback = this.removalCallback.bind(this);
      this.mutationObserverCallback = this.mutationObserverCallback.bind(this);
      this.focusHandler = this.focusHandler.bind(this);
      this.getItemById = this.getItemById.bind(this);
      this.getHistoryItemById = this.getHistoryItemById.bind(this);
      this.onTabClosed = this.onTabClosed.bind(this);
      this.clearHistory = this.clearHistory.bind(this);
      this.initializePlugin = this.initializePlugin.bind(this);
      this.moveFocus = this.moveFocus.bind(this);
      this.saveContainer = this.saveContainer.bind(this);
      this.highlightElementByConfig = this.highlightElementByConfig.bind(this);
      this.constructTreeIfAlive = this.constructTreeIfAlive.bind(this);
      this.throttledConstructTree = throttle(
         this.constructTreeIfAlive,
         TREE_UPDATE_FREQUENCY
      );
      this.mutationObserver = new MutationObserver(
         this.mutationObserverCallback
      );
      getGlobalChannel().addListener(
         GlobalMessages.devtoolsClosed,
         this.onTabClosed
      );
      this.channel.addListener('tabClosed', this.onTabClosed);
      this.channel.addListener('clearHistory', this.clearHistory);
      this.channel.addListener('focusInitialized', this.initializePlugin);
      this.channel.addListener(
         'highlightElement',
         this.highlightElementByConfig
      );
      this.channel.addListener('viewContainer', this.saveContainer);
      this.channel.addListener('moveFocus', this.moveFocus);
   }

   private async initializePlugin(): Promise<void> {
      if (!this.pluginInitialized) {
         this.mutationObserver.observe(document.documentElement, {
            childList: true,
            subtree: true
         });
      }
      await this.initializeTree();
      if (document.activeElement) {
         this.changeFocusedItem(document.activeElement);
      }
   }

   private async initializeTree(): Promise<void> {
      this.historyItems.clear();
      await this.constructTree();
      if (!this.pluginInitialized) {
         document.body.addEventListener('focus', this.focusHandler, true);
      }
      this.pluginInitialized = true;
   }

   private async constructTree(): Promise<void> {
      this.removalObserver.clearObservedElements();
      this.elementFinder = await this.focusLibLoader.getElementFinder();
      this.items = getFullFocusTree(
         this.elementFinder,
         this.removalObserver,
         this.removalCallback
      );
      this.channel.dispatch('fullItems', Array.from(this.items.values()));
   }

   private highlightElementByConfig(config?: {
      id: IBackendItem['id'];
      isHistory: boolean;
   }): void {
      if (config) {
         const nodeGetter = config.isHistory
            ? this.getHistoryItemById
            : this.getItemById;

         const node = nodeGetter(config.id);
         if (node) {
            this.highlighter.highlightElement(
               [node[0] as IWasabyElement],
               node[1].caption
            );
         }
      } else {
         this.highlighter.highlightElement();
      }
   }

   private saveContainer(config: {
      id: IBackendItem['id'];
      isHistory: boolean;
   }): void {
      const nodeGetter = config.isHistory
         ? this.getHistoryItemById
         : this.getItemById;
      const node = nodeGetter(config.id);

      if (node) {
         window.__WASABY_DEV_HOOK__.__container = node[0];
      } else {
         window.__WASABY_DEV_HOOK__.__container = undefined;
      }
   }

   private getItemById(id: number): [Node, IBackendItem] | void {
      return Array.from(this.items).find(([_, item]) => item.id === id);
   }

   private getHistoryItemById(id: number): [Node, IHistoryItem] | void {
      return Array.from(this.historyItems).find(([_, item]) =>
         item.ids.includes(id)
      );
   }

   private mutationObserverCallback(): void {
      this.throttledConstructTree();
   }

   private removalCallback(elem: Element): void {
      this.items.delete(elem);
      this.historyItems.delete(elem);
   }

   private focusHandler(e: FocusEvent): void {
      this.addItemToHistory(e.target as Element);
      this.changeFocusedItem(e.target as Element);
   }

   private async moveFocus(reverse: boolean): Promise<void> {
      if (!document.activeElement) {
         return;
      }
      const next = this.elementFinder.findWithContexts(
         document.body,
         document.activeElement,
         reverse
      );
      if (next) {
         const focusFromLib = await this.focusLibLoader.getFocusFromLib();
         if (focusFromLib(next)) {
            // chrome doesn't fire focus event when focus is moved manually, so we have to call handlers here
            this.addItemToHistory(next);
            this.changeFocusedItem(next);
         }
      }
   }

   private addItemToHistory(target: Element): void {
      const item = this.historyItems.get(target) || {
         ids: [],
         caption: getCaption(target)
      };
      if (!this.historyItems.has(target)) {
         this.historyItems.set(target, item);
      }
      const newId = getId();
      item.ids.push(newId);
      this.channel.dispatch('addItemToHistory', item);
   }

   private changeFocusedItem(target: Element): void {
      const item = this.items.get(target);
      if (item) {
         this.channel.dispatch('changeFocusedItem', {
            id: item.id,
            type: 'self'
         });
      } else {
         let parent = target.parentElement;

         while (parent) {
            const itemForParent = this.items.get(parent);
            if (itemForParent) {
               this.channel.dispatch('changeFocusedItem', {
                  id: itemForParent.id,
                  type: 'child'
               });
               return;
            }
            parent = parent.parentElement;
         }

         this.channel.dispatch('changeFocusedItem');
      }
   }

   private onTabClosed(): void {
      this.mutationObserver.disconnect();
      this.pluginInitialized = false;
      this.clearHistory();
      document.body.removeEventListener('focus', this.focusHandler, true);
   }

   private clearHistory(): void {
      this.historyItems.clear();
   }

   private async constructTreeIfAlive(): Promise<void> {
      // Because this callback is throttled, the devtools can be closed before it executes.
      // We don't need to do anything in this case.
      if (this.pluginInitialized) {
         await this.constructTree();
         if (document.activeElement) {
            this.changeFocusedItem(document.activeElement);
         }
      }
   }

   static getName(): string {
      return 'Focus';
   }
}

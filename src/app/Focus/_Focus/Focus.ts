import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import * as template from 'wml!Focus/_Focus/Focus';
import { ContentChannel } from '../../Devtool/Event/ContentChannel';
import { IBackendItem, IHistoryItem } from 'Extension/Plugins/Focus/Focus';
import 'css!Focus/focus';
// TODO: это нужно из-за того, что в шаблоне скопирована правая панелька, потом просто перенесу стили
import 'css!Elements/elements';

const DEFAULT_EVAL_TIMEOUT = 100;

interface IFrontendItem extends IBackendItem {
   depth: number;
}

interface IIcon {
   icon: string;
   iconStyle: 'secondary' | 'danger';
   title: string;
}

interface IFocusedItem {
   id: IFrontendItem['id'];
   type: 'self' | 'child';
}

const DEFAULT_DETAILS_WIDTH = 300;

/**
 * Controller of the "Focus" tab.
 * @author Зайцев А.С.
 */
class Focus extends Control<IControlOptions> {
   protected _template: TemplateFunction = template;
   protected _items?: IFrontendItem[];
   protected _historyItems: IHistoryItem[] = [];
   protected _focusedItem?: IFocusedItem;
   protected _detailsWidth: number;
   protected _icons: Record<string, IIcon> = {
      autofocus: {
         icon: 'icon-WorkInFocus',
         iconStyle: 'secondary',
         title: 'This element will be focused on the page load/popup creation'
      },
      hidden: {
         icon: 'icon-Hide',
         iconStyle: 'danger',
         title:
            "This element is hidden with visibility: hidden and can't be focused"
      },
      invisible: {
         icon: 'icon-Hide',
         iconStyle: 'danger',
         title: "This element is hidden with display: none and can't be focused"
      },
      cycle: {
         icon: 'icon-Refresh',
         iconStyle: 'secondary',
         title: 'This element creates a cycling context'
      },
      focusBlocker: {
         icon: 'icon-Decline',
         iconStyle: 'danger',
         title:
            'The element is not reachable via sequential keyboard navigation'
      },
      brokenLink: {
         icon: 'icon-Unlink',
         iconStyle: 'danger',
         title:
            'The <a> element should have either href or tabindex >= 0 to be focusable'
      }
   };
   private channel: ContentChannel = new ContentChannel('Focus');

   constructor(options: IControlOptions) {
      super(options);
      this.addItemToHistory = this.addItemToHistory.bind(this);
      this.changeFocusedItem = this.changeFocusedItem.bind(this);
      this.preprocessItems = this.preprocessItems.bind(this);
   }

   protected _beforeMount(): Promise<void> {
      return new Promise((resolve) => {
         chrome.storage.sync.get('focusDetailsWidth', (result) => {
            if (result.focusDetailsWidth) {
               this._detailsWidth = result.focusDetailsWidth;
            } else {
               this._detailsWidth = DEFAULT_DETAILS_WIDTH;
            }
            resolve();
         });
      });
   }

   protected _afterMount(): void {
      this.channel.addListener('fullItems', this.preprocessItems);
      this.channel.addListener('addItemToHistory', this.addItemToHistory);
      this.channel.addListener('changeFocusedItem', this.changeFocusedItem);
      this.channel.dispatch('focusInitialized');
   }

   protected _beforeUpdate(newOptions: IControlOptions): void {
      if (this._options.selected && !newOptions.selected) {
         this.channel.dispatch('tabClosed');
      }
      if (!this._options.selected && newOptions.selected) {
         this.channel.dispatch('focusInitialized');
      }
   }

   protected _beforeUnmount(): void {
      this.channel.destructor();
   }

   protected _offsetHandler(e: Event, offset: number): void {
      this._detailsWidth = this._detailsWidth + offset;
      chrome.storage.sync.set({
         focusDetailsWidth: this._detailsWidth
      });
   }

   protected _highlightElement(e: Event): void;
   protected _highlightElement(
      e: Event,
      isHistory: boolean,
      id: IBackendItem['id']
   ): void;
   protected _highlightElement(
      e: Event,
      isHistory?: boolean,
      id?: IBackendItem['id']
   ): void {
      if (typeof id !== 'undefined') {
         this.channel.dispatch('highlightElement', {
            id,
            isHistory
         });
      } else {
         this.channel.dispatch('highlightElement');
      }
   }

   protected _onItemClick(
      e: Event,
      isHistory: boolean,
      id: IBackendItem['id']
   ): void {
      this.channel.dispatch('viewContainer', {
         id,
         isHistory
      });
      setTimeout(() => {
         chrome.devtools.inspectedWindow.eval(
            'inspect(window.__WASABY_DEV_HOOK__.__container)'
         );
      }, DEFAULT_EVAL_TIMEOUT);
   }

   protected _getColorClassForItem(item: IFrontendItem): string {
      if (
         item.labels.some(
            (label) =>
               label === 'invisible' ||
               label === 'hidden' ||
               label === 'brokenLink'
         )
      ) {
         return 'devtools-Focus__item_withDangerousLabel';
      }
      if (item.focusable) {
         return 'devtools-Focus__item_focusable';
      } else {
         return 'devtools-Focus__item_nonFocusable';
      }
   }

   protected _getBackgroundClassForFocusedItem(item: IFocusedItem): string {
      switch (item.type) {
         case 'self':
            return 'devtools-Focus__item_selfFocused';
         case 'child':
            return 'devtools-Focus__item_childFocused';
      }
   }

   protected _moveFocus(e: Event, reverse: boolean): void {
      this.channel.dispatch('moveFocus', reverse);
   }

   protected _clearHistory(): void {
      this._historyItems = [];
      this.channel.dispatch('clearHistory');
   }

   private addItemToHistory(item: IHistoryItem): void {
      this._historyItems.unshift(item);
   }

   private changeFocusedItem(newItem?: IFocusedItem): void {
      this._focusedItem = newItem;
   }

   private preprocessItems(items: IBackendItem[]): void {
      const depthMap: Map<IBackendItem['id'], number> = new Map();
      const itemsToChildren: Map<
         IFrontendItem['id'],
         IFrontendItem[]
      > = new Map();
      const topItems: IFrontendItem[] = [];

      items.forEach((item) => {
         let newItem;

         if (item.parentId === null) {
            newItem = {
               ...item,
               depth: 0
            };
            topItems.push(newItem);
         } else {
            newItem = {
               ...item,
               depth: (depthMap.get(item.parentId) as number) + 1
            };

            const siblings = itemsToChildren.get(
               item.parentId
            ) as IFrontendItem[];
            siblings.push(newItem);
         }

         depthMap.set(item.id, newItem.depth);
         itemsToChildren.set(item.id, []);
      });

      this._items = constructTree(topItems, itemsToChildren);
   }
}

function constructTree(
   topItems: IFrontendItem[],
   itemsToChildren: Map<IFrontendItem['id'], IFrontendItem[]>
): IFrontendItem[] {
   topItems.sort((first, second) => {
      if (first.tabindex < 0 || second.tabindex < 0) {
         return 0;
      }
      return first.tabindex - second.tabindex;
   });

   let sortedItems: IFrontendItem[] = [];
   topItems.forEach((item) => {
      const children = itemsToChildren.get(item.id) as IFrontendItem[];
      sortedItems.push(item);
      sortedItems = sortedItems.concat(
         constructTree(children, itemsToChildren)
      );
   });

   return sortedItems;
}

export default Focus;

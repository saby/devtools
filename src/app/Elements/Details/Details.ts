import Control = require('Core/Control');
import template = require('wml!Elements/Details/Details');
import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { descriptor } from 'Types/entity';
import Store from 'Elements/Store';

import 'css!Elements/Details/Details';

interface IOptions extends IControlNode {
   store: Store;
}

class Details extends Control {
   protected _template: Function = template;
   protected readonly _options: Readonly<IOptions>;
   protected _optionsExpanded: boolean = true;
   protected _stateExpanded: boolean = true;
   protected _eventsExpanded: boolean = false;
   protected _attributesExpanded: boolean = false;

   private __viewFunctionSource(e: Event, path: Array<string | number>): void {
      this._options.store.dispatch('viewFunctionSource', {
         id: this._options.id,
         path
      });
      setTimeout(() => {
         chrome.devtools.inspectedWindow.eval(
            'inspect(window.__WASABY_DEV_HOOK__.__function)'
         );
      }, 100);
   }

   private __viewConstructor(): void {
      this._options.store.dispatch('viewConstructor', this._options.id);
      setTimeout(() => {
         chrome.devtools.inspectedWindow.eval(
            'inspect(window.__WASABY_DEV_HOOK__.__constructor)'
         );
      }, 100);
   }

   private __viewContainer(): void {
      this._options.store.dispatch('viewContainer', this._options.id);
      setTimeout(() => {
         chrome.devtools.inspectedWindow.eval(
            'inspect(window.__WASABY_DEV_HOOK__.__container)'
         );
      }, 100);
   }

   private __storeAsGlobal(e: Event, path: Array<string | number>): void {
      this._options.store.dispatch('storeAsGlobal', {
         id: this._options.id,
         path
      });
   }

   private __viewTemplate(): void {
      this._options.store.dispatch('viewTemplate', this._options.id);
      setTimeout(() => {
         chrome.devtools.inspectedWindow.eval(
            'inspect(window.__WASABY_DEV_HOOK__.__template)'
         );
      }, 100);
   }

   private __hasData(data: object): boolean {
      return data && Object.keys(data).length > 0;
   }

   // static getOptionTypes(): Record<keyof IOptions, unknown> {
   //    return {
   //       channel: descriptor(ContentChannel).required(),
   //       id: descriptor(Number).required(),
   //       name: descriptor(String).required(),
   //       template: descriptor(String).required(),
   //       options: descriptor(Object),
   //       attributes: descriptor(Object),
   //       eventHandlers: descriptor(Object),
   //       state: descriptor(Object),
   //       parentId: descriptor(Number)
   //    };
   // }
}

export default Details;

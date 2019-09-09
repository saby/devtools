import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
// @ts-ignore
import template = require('wml!Elements/_Details/Details');
import { IFrontendControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { descriptor } from 'Types/entity';
import Store from '../_store/Store';

import 'css!Elements/elements';
import { NodeOptionType } from 'Extension/Plugins/Elements/IRenderer';

interface IOptions extends IControlOptions {
   id: IFrontendControlNode['id'];
   store: Store;
   isControl: boolean;
   optionsExpanded: boolean;
   stateExpanded: boolean;
   eventsExpanded: boolean;
   attributesExpanded: boolean;
   options?: object;
   changedOptions?: object;
   changedState?: object;
   state?: object;
   events?: object;
   attributes?: object;
   changedAttributes?: object;
}

class Details extends Control<IOptions> {
   protected _template: TemplateFunction = template;

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

   private __forwardExpanded(
      e: Event,
      eventName: string,
      value: boolean
   ): void {
      this._notify('expandedChanged', [eventName, value]);
   }

   private __setNodeOption(
      e: Event,
      optionType: NodeOptionType,
      path: string[],
      value: string
   ): void {
      this._options.store.dispatch('setNodeOption', {
         id: this._options.id,
         optionType,
         path,
         value
      });
   }

   private __revertNodeOption(
      e: Event,
      optionType: NodeOptionType,
      path: string[]
   ): void {
      this._options.store.dispatch('revertNodeOption', {
         id: this._options.id,
         optionType,
         path
      });
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         store: descriptor(Store).required(),
         id: descriptor(Number).required(),
         isControl: descriptor(Boolean).required(),
         optionsExpanded: descriptor(Boolean).required(),
         stateExpanded: descriptor(Boolean).required(),
         eventsExpanded: descriptor(Boolean).required(),
         attributesExpanded: descriptor(Boolean).required(),
         options: descriptor(Object),
         changedOptions: descriptor(Object),
         attributes: descriptor(Object),
         changedAttributes: descriptor(Object),
         events: descriptor(Object),
         state: descriptor(Object),
         changedState: descriptor(Object),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default Details;

import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
import * as template from 'wml!Elements/_Details/Details';
import { IFrontendControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { descriptor } from 'Types/entity';
import Store from '../_store/Store';
import { EventUtils } from 'UI/Events';
import 'css!Elements/elements';

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
   logicParentName?: string;
   eventWithBreakpoint?: string;
   elementsWithBreakpoints?: Set<IFrontendControlNode['id']>;
}

const DEFAULT_EVAL_TIMEOUT = 100;

/**
 * Renders information about the selected control - options, attributes, state, attributes and adds links to the sources.
 * @author Зайцев А.С.
 */
class Details extends Control<IOptions> {
   protected _template: TemplateFunction = template;
   protected _notifyHandler: Function = EventUtils.tmplNotify;

   protected _viewFunctionSource(e: Event, path: Array<string | number>): void {
      this._options.store.dispatch('viewFunctionSource', {
         id: this._options.id,
         path
      });
      setTimeout(() => {
         chrome.devtools.inspectedWindow.eval(
            'inspect(window.__WASABY_DEV_HOOK__.__function)'
         );
      }, DEFAULT_EVAL_TIMEOUT);
   }

   protected _viewConstructor(): void {
      this._options.store.dispatch('viewConstructor', this._options.id);
      setTimeout(() => {
         chrome.devtools.inspectedWindow.eval(
            'inspect(window.__WASABY_DEV_HOOK__.__constructor)'
         );
      }, DEFAULT_EVAL_TIMEOUT);
   }

   protected _viewContainer(): void {
      this._options.store.dispatch('viewContainer', this._options.id);
      setTimeout(() => {
         chrome.devtools.inspectedWindow.eval(
            'inspect(window.__WASABY_DEV_HOOK__.__container)'
         );
      }, DEFAULT_EVAL_TIMEOUT);
   }

   protected _storeAsGlobal(e: Event, path: Array<string | number>): void {
      this._options.store.dispatch('storeAsGlobal', {
         id: this._options.id,
         path
      });
   }

   protected _viewTemplate(): void {
      this._options.store.dispatch('viewTemplate', this._options.id);
      setTimeout(() => {
         chrome.devtools.inspectedWindow.eval(
            'inspect(window.__WASABY_DEV_HOOK__.__template)'
         );
      }, DEFAULT_EVAL_TIMEOUT);
   }

   protected _forwardExpanded(
      e: Event,
      eventName: string,
      value: boolean
   ): void {
      this._notify('expandedChanged', [eventName, value]);
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
         logicParentName: descriptor(String),
         elementsWithBreakpoints: descriptor(Set),
         eventWithBreakpoint: descriptor(String),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default Details;

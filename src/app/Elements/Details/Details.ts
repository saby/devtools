import Control = require('Core/Control');
import template = require('wml!Elements/Details/Details');
import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { descriptor } from 'Types/entity';
import { TEMPLATES } from './const';
import { ContentChannel } from 'Devtool/Event/ContentChannel';

//TODO: сделать это через async
import './templates/StringTemplate';
import './templates/NumberTemplate';
import './templates/ObjectTemplate';
import 'css!Elements/Details/Details';

interface IOptions extends IControlNode {
   channel: ContentChannel;
}

class Details extends Control {
   protected _template: Function = template;
   protected readonly _options: Readonly<IOptions>;

   private __getTemplate(value: unknown): string {
      const type = typeof value;
      if (TEMPLATES.hasOwnProperty(type)) {
         return TEMPLATES[type];
      }
      return TEMPLATES.string;
   }

   private __viewFunctionSource(e: Event, rootField: string, path: Array<string | number>): void {
      this._options.channel.dispatch('viewFunctionSource', {
         id: this._options.id,
         path: path.concat(rootField)
      });
      setTimeout(() => {
         chrome.devtools.inspectedWindow.eval(
            'inspect(window.__WASABY_DEV_HOOK__.__function)'
         );
      }, 100);
   }

   private __viewConstructor(): void {
      this._options.channel.dispatch('viewConstructor', this._options.id);
      setTimeout(() => {
         chrome.devtools.inspectedWindow.eval(
            'inspect(window.__WASABY_DEV_HOOK__.__constructor)'
         );
      }, 100);
   }

   private __storeAsGlobal(e: Event, path: Array<string | number>): void {
      this._options.channel.dispatch('storeAsGlobal', {
         id: this._options.id,
         path: path.concat('options')
      });
   }

   private __viewTemplate(): void {
      this._options.channel.dispatch('viewTemplate', this._options.id);
      setTimeout(() => {
         chrome.devtools.inspectedWindow.eval(
            'inspect(window.__WASABY_DEV_HOOK__.__template)'
         );
      }, 100);
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

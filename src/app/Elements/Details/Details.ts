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
import './templates/FunctionTemplate';

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

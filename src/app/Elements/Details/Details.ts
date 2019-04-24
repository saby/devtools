import Control = require('Core/Control');
import template = require('wml!Elements/Details/Details');
import { IControlNode } from '../../../interface/IControlNode';
import { descriptor } from 'Types/entity';
import { TEMPLATES } from './const';
import { ContentChannel } from 'ExtensionCore/ContentChannel';

//TODO: сделать это через async
import './templates/String';
import './templates/Number';
import './templates/Object';
import './templates/Function';

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

   private __viewSource(): void {
      this._options.channel.dispatch('viewSource', this._options.id);
      setTimeout(() => {
         chrome.devtools.inspectedWindow.eval(
            'inspect(window.__WASABY_DEV_HOOK__.__instance)'
         );
      }, 100);
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         channel: descriptor(ContentChannel).required(),
         id: descriptor(Number).required(),
         name: descriptor(String).required(),
         type: descriptor(String).required(),
         options: descriptor(Object),
         attributes: descriptor(Object),
         eventHandlers: descriptor(Object),
         state: descriptor(Object),
         parentId: descriptor(Number),
         key: descriptor(Number)
      };
   }
}

export default Details;

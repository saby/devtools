import Control = require('Core/Control');
import template = require('wml!Elements/Details/Details');
import { IControlNode } from '../../../extension/const';
import { descriptor } from 'Types/entity';
import { TEMPLATES } from './const';

//TODO: сделать это через async
import './templates/String';
import './templates/Number';
import './templates/Object';
import './templates/Function';

type IOptions = IControlNode;

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

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         id: descriptor(Number).required(),
         name: descriptor(String).required(),
         type: descriptor(Function).required(),
         options: descriptor(Object),
         attributes: descriptor(Object),
         eventHandlers: descriptor(Object),
         state: descriptor(Object)
      };
   }
}

export default Details;

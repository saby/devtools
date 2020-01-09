import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!Elements/_Details/Pane/templates/BooleanTemplate');
import { descriptor } from 'Types/entity';
import { ITemplateOptions } from './ITemplate';
import 'css!Elements/elements';

interface IOptions extends ITemplateOptions {
   value: boolean;
}

/**
 * Template for booleans.
 * @author Зайцев А.С.
 */
class BooleanTemplate extends Control {
   protected _template: TemplateFunction = template;
   protected readonly _options: Readonly<IOptions>;

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         value: descriptor(Boolean).required(),
         name: descriptor(String, Number).required(),
         key: descriptor(String).required(),
         itemData: descriptor(Object)
      };
   }
}

export default BooleanTemplate;

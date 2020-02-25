import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!Elements/_Details/Pane/templates/NumberTemplate');
import { descriptor } from 'Types/entity';
import { ITemplateOptions } from './ITemplate';

interface IOptions extends ITemplateOptions {
   value: number;
}

/**
 * Template for numbers.
 * @author Зайцев А.С.
 */
class NumberTemplate extends Control {
   protected _template: TemplateFunction = template;
   protected readonly _options: Readonly<IOptions>;

   static _theme: string[] = ['Elements/elements'];

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         value: descriptor(Number).required(),
         name: descriptor(String, Number).required(),
         key: descriptor(String).required(),
         itemData: descriptor(Object)
      };
   }
}

export default NumberTemplate;

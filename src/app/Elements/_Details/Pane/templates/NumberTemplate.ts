import { Control, TemplateFunction } from 'UI/Base';
// @ts-ignore
import template = require('wml!Elements/_Details/Pane/templates/NumberTemplate');
import { descriptor } from 'Types/entity';
import { ITemplateOptions } from './ITemplate';
import 'css!Elements/elements';

interface IOptions extends ITemplateOptions {
   value: number;
}

class NumberTemplate extends Control {
   protected _template: TemplateFunction = template;
   protected readonly _options: Readonly<IOptions>;

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

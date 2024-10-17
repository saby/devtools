import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!Elements/_Details/Pane/templates/NumberTemplate';
import { descriptor } from 'Types/entity';
import { ITemplateOptions } from './ITemplate';
import 'css!Elements/elements';

/**
 * Template for numbers.
 * @author Зайцев А.С.
 */
class NumberTemplate extends Control<ITemplateOptions> {
   protected _template: TemplateFunction = template;

   static getOptionTypes(): Record<keyof ITemplateOptions, unknown> {
      return {
         caption: descriptor(String).required(),
         name: descriptor(String, Number).required(),
         key: descriptor(String).required(),
         itemData: descriptor(Object),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default NumberTemplate;

import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!Elements/_Details/Pane/templates/BooleanTemplate';
import { descriptor } from 'Types/entity';
import { ITemplateOptions } from './ITemplate';
import 'css!Elements/elements';

/**
 * Template for booleans.
 * @author Зайцев А.С.
 */
class BooleanTemplate extends Control<ITemplateOptions> {
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

export default BooleanTemplate;

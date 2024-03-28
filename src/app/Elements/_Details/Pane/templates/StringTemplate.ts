import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!Elements/_Details/Pane/templates/StringTemplate';
import { descriptor } from 'Types/entity';
import { ITemplateOptions } from './ITemplate';
import 'css!Elements/elements';

/**
 * Template for strings.
 * @author Зайцев А.С.
 */
class StringTemplate extends Control<ITemplateOptions> {
   protected _template: TemplateFunction = template;

   protected _viewFunctionSource(): void {
      this._notify(
         'viewFunctionSource',
         [this._options.key.split('---').reverse()],
         {
            bubbling: true
         }
      );
   }

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

export default StringTemplate;

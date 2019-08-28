import Control = require('Core/Control');
import template = require('wml!Elements/_Details/Pane/templates/StringTemplate');
import { descriptor } from 'Types/entity';
import { ITemplateOptions } from './ITemplate';
import 'css!Elements/_Details/Pane/templates/StringTemplate';

interface IOptions extends ITemplateOptions {
   value: string;
}

class StringTemplate extends Control {
   protected _template: Function = template;
   protected readonly _options: Readonly<IOptions>;

   private __viewFunctionSource(): void {
      this._notify(
         'viewFunctionSource',
         [this._options.key.split('---').reverse()],
         {
            bubbling: true
         }
      );
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         value: descriptor(String).required(),
         name: descriptor(String, Number).required(),
         key: descriptor(String).required()
      };
   }
}

export default StringTemplate;

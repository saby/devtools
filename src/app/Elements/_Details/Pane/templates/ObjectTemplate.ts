import Control = require('Core/Control');
import template = require('wml!Elements/_Details/Pane/templates/ObjectTemplate');
import { descriptor } from 'Types/entity';
import { ITemplateOptions } from './ITemplate';
import 'css!Elements/elements';

interface IOptions extends ITemplateOptions {
   value: object;
}

class ObjectTemplate extends Control {
   protected _template: Function = template;
   protected readonly _options: Readonly<IOptions>;
   protected _caption: string;

   constructor(options: Readonly<IOptions>) {
      super();
      this._caption = this.__getCaption(options.value);
   }

   _beforeUpdate(newOptions: Readonly<IOptions>): void {
      if (this._options.value !== newOptions.value) {
         this._caption = this.__getCaption(newOptions.value);
      }
   }

   private __getCaption(value: object): string {
      if (value instanceof Array) {
         return `Array[${value.length}]`;
      } else if (value === null) {
         return 'null';
      } else {
         return Object.keys(value).length === 0 ? 'Empty object' : 'Object';
      }
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         value: descriptor(Object, null).required(),
         name: descriptor(String, Number).required(),
         key: descriptor(String).required()
      };
   }
}

export default ObjectTemplate;

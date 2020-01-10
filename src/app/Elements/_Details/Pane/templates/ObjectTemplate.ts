import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!Elements/_Details/Pane/templates/ObjectTemplate');
import { descriptor } from 'Types/entity';
import { ITemplateOptions } from './ITemplate';
import 'css!Elements/elements';

interface IOptions extends ITemplateOptions {
   value: object;
}

/**
 * Template for objects. Shows only a caption which is created based on the type of object and the length of its keys.
 * @author Зайцев А.С.
 */
class ObjectTemplate extends Control {
   protected _template: TemplateFunction = template;
   protected readonly _options: Readonly<IOptions>;
   protected _caption: string;

   constructor(options: Readonly<IOptions>) {
      super(options);
      this._caption = getCaption(options.value);
   }

   _beforeUpdate(newOptions: Readonly<IOptions>): void {
      if (this._options.value !== newOptions.value) {
         this._caption = getCaption(newOptions.value);
      }
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         value: descriptor(Object, null).required(),
         name: descriptor(String, Number).required(),
         key: descriptor(String).required(),
         itemData: descriptor(Object)
      };
   }
}

function getCaption(value: object): string {
   if (value instanceof Array) {
      return `Array[${value.length}]`;
   } else if (value === null) {
      return 'null';
   } else {
      return Object.keys(value).length === 0 ? 'Empty object' : 'Object';
   }
}

export default ObjectTemplate;

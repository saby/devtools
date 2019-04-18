import Control = require('Core/Control');
import template = require('wml!Elements/Details/templates/Object');
import { descriptor } from 'Types/entity';
import { ITemplateOptions } from './ITemplate';
import { TEMPLATES } from '../const';

interface IOptions extends ITemplateOptions {
   value: object;
}

class ObjectTemplate extends Control {
   protected _template: Function = template;
   protected readonly _options: Readonly<IOptions>;
   protected _expanded: boolean = false;
   protected _caption: string;

   constructor(options: Readonly<IOptions>) {
      super();
      this._caption = options.value instanceof Array ? `Array[${options.value.length}]` : 'Object';
   }

   _beforeUpdate(newOptions: Readonly<IOptions>): void {
      if (this._options.value !== newOptions.value) {
         this._caption = newOptions.value instanceof Array ? `Array[${newOptions.value.length}]` : 'Object';
      }
   }

   protected _toggleExpanded(): void {
      this._expanded = !this._expanded;
   }

   private __getTemplate(value: unknown): string {
      const type = typeof value;
      if (TEMPLATES.hasOwnProperty(type)) {
         return TEMPLATES[type];
      }
      return TEMPLATES.string;
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         value: descriptor(Object).required(),
         name: descriptor(String, Number).required()
      };
   }
}

// TODO: ws:partial плохо работатает с дефолтными экспортами, надо будет раскопать почему
export = ObjectTemplate;

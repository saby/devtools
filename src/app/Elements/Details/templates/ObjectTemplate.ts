import Control = require('Core/Control');
import template = require('wml!Elements/Details/templates/ObjectTemplate');
import { descriptor } from 'Types/entity';
import { ITemplateOptions } from './ITemplate';
import { TEMPLATES } from '../const';
import 'css!Elements/Details/templates/ObjectTemplate';

interface IOptions extends ITemplateOptions {
   value: object;
   depth?: number;
}

class ObjectTemplate extends Control {
   protected _template: Function = template;
   protected readonly _options: Readonly<IOptions>;
   protected _expanded: boolean = false;
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

   protected _viewFunctionSource(e: Event, path: Array<string | number>): void {
      this._notify('viewFunctionSource', [path.concat(this._options.name)]);
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

   private __getCaption(value: object): string {
      if (value instanceof Array) {
         return `Array[${value.length}]`;
      } else if (value === null) {
         return 'null';
      } else {
         return 'Object';
      }
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         value: descriptor(Object, null).required(),
         name: descriptor(String, Number).required(),
         depth: descriptor(Number)
      };
   }

   static getDefaultOptions(): object {
      return {
         depth: 1
      };
   }
}

// TODO: ws:partial плохо работатает с дефолтными экспортами, надо будет раскопать почему
export = ObjectTemplate;

import Control = require('Core/Control');
import template = require('wml!Elements/Details/templates/Number');
import { descriptor } from 'Types/entity';
import { ITemplateOptions } from './ITemplate';

interface IOptions extends ITemplateOptions {
   value: number;
}

class NumberTemplate extends Control {
   protected _template: Function = template;
   protected readonly _options: Readonly<IOptions>;

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         value: descriptor(Number).required(),
         name: descriptor(String, Number).required()
      };
   }
}

// TODO: ws:partial плохо работатает с дефолтными экспортами, надо будет раскопать почему
export = NumberTemplate;

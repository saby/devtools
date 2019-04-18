import Control = require('Core/Control');
import template = require('wml!Elements/Details/templates/String');
import { descriptor } from 'Types/entity';
import { ITemplateOptions } from './ITemplate';

interface IOptions extends ITemplateOptions {
   value: string;
}

class StringTemplate extends Control {
   protected _template: Function = template;
   protected readonly _options: Readonly<IOptions>;

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         value: descriptor(String).required(),
         name: descriptor(String, Number).required()
      };
   }
}

// TODO: ws:partial плохо работатает с дефолтными экспортами, надо будет раскопать почему
export = StringTemplate;

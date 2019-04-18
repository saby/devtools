import Control = require('Core/Control');
import template = require('wml!Elements/Details/templates/Function');
import { descriptor } from 'Types/entity';
import { ITemplateOptions } from './ITemplate';

interface IOptions extends ITemplateOptions {
   value: Function;
}

class FunctionTemplate extends Control {
   protected _template: Function = template;
   protected readonly _options: Readonly<IOptions>;
   protected _collapsed: boolean = true;

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         value: descriptor(Function).required(),
         name: descriptor(String, Number).required()
      };
   }
}

// TODO: ws:partial плохо работатает с дефолтными экспортами, надо будет раскопать почему
export = FunctionTemplate;

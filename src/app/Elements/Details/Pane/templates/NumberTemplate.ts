import Control = require('Core/Control');
import template = require('wml!Elements/Details/Pane/templates/NumberTemplate');
import { descriptor } from 'Types/entity';
import { ITemplateOptions } from './ITemplate';
import 'css!Elements/Details/Pane/templates/NumberTemplate';

interface IOptions extends ITemplateOptions {
   value: number;
}

class NumberTemplate extends Control {
   protected _template: Function = template;
   protected readonly _options: Readonly<IOptions>;

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         value: descriptor(Number).required(),
         name: descriptor(String, Number).required(),
         key: descriptor(String).required()
      };
   }
}

// TODO: ws:partial плохо работатает с дефолтными экспортами, надо будет раскопать почему
export = NumberTemplate;

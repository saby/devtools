import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
import template = require('wml!Devtool/Layout/Browser');
import { descriptor } from 'Types/entity';

interface IOptions extends IControlOptions {
   headTemplate?: TemplateFunction;
   content: TemplateFunction;
}

class Browser extends Control<IOptions> {
   protected _template: TemplateFunction = template;

   static _theme: string[] = ['Devtool/Layout/Browser'];

   static getOptionsTypes(): Record<keyof IOptions, unknown> {
      return {
         content: descriptor(Function).required(),
         headTemplate: descriptor(Function),
         theme: descriptor(String),
         readOnly: descriptor(Boolean)
      };
   }
}

export default Browser;

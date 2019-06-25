import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
// @ts-ignore
import template = require('wml!Devtool/Layout/Browser');
import { descriptor } from 'Types/entity';
import 'css!Devtool/Layout/Browser';

interface IOptions extends IControlOptions {
   headTemplate?: TemplateFunction;
   content: TemplateFunction;
}

class Browser extends Control<IOptions> {
   protected _template: TemplateFunction = template;

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

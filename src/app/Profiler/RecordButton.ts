import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
// @ts-ignore
import template = require('wml!Profiler/RecordButton');
import { descriptor } from 'Types/entity';
import 'css!Profiler/RecordButton';

interface IOptions extends IControlOptions {
   isProfiling: boolean;
}

class RecordButton extends Control<IOptions> {
   protected _template: TemplateFunction = template;

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         isProfiling: descriptor(Boolean).required(),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default RecordButton;

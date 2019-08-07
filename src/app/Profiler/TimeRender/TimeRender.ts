import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
// @ts-ignore
import template = require('wml!Profiler/TimeRender/TimeRender');
import { descriptor } from 'Types/entity';
import 'css!Profiler/TimeRender/TimeRender';
import { formatTime } from '../Utils';

interface IOptions extends IControlOptions {
   value: number;
   barColor: string;
   length?: number;
}

class TimeRender extends Control<IOptions> {
   protected _template: TemplateFunction = template;
   protected _formattedValue: string;

   protected _beforeMount(options: IOptions): void {
      this._formattedValue = formatTime(options.value);
   }

   protected _beforeUpdate(newOptions: IOptions): void {
      if (this._options.value !== newOptions.value) {
         this._formattedValue = formatTime(newOptions.value);
      }
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         value: descriptor(Number).required(),
         barColor: descriptor(String).required(),
         length: descriptor(Number),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default TimeRender;

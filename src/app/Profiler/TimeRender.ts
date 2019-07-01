import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
// @ts-ignore
import template = require('wml!Profiler/TimeRender');
import { descriptor } from 'Types/entity';
import 'css!Profiler/TimeRender';

interface IOptions extends IControlOptions {
   value: number;
   length?: number;
}

function formatValue(value: number): string {
   if (value >= 1000) {
      return value.toFixed(2) + 's';
   } else {
      return value.toFixed(2) + 'ms';
   }
}

class TimeRender extends Control<IOptions> {
   protected _template: TemplateFunction = template;
   protected _formattedValue: string;

   protected _beforeMount(options: IOptions): void {
      this._formattedValue = formatValue(options.value);
   }

   protected _beforeUpdate(newOptions: IOptions): void {
      if (this._options.value !== newOptions.value) {
         this._formattedValue = formatValue(newOptions.value);
      }
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         value: descriptor(Number).required(),
         length: descriptor(Number),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default TimeRender;

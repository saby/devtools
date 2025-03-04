import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import * as template from 'wml!Profiler/_TimeRender/TimeRender';
import { descriptor } from 'Types/entity';
import { formatTime } from '../_utils/Utils';
import { IStackedBar } from '../_StackedBar/StackedBar';
import 'css!Profiler/profiler';

interface IOptions extends IControlOptions {
   value: number;
   bars: IStackedBar[];
}

/**
 * Module for rendering time in the profiler. Converts time to a formatted string and renders a bar representing the time near that string.
 * @author Зайцев А.С.
 */
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
         bars: descriptor(Array).required(),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default TimeRender;

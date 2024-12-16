import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import * as template from 'wml!Profiler/_StackedBar/StackedBar';
import { descriptor } from 'Types/entity';
import { formatTime } from '../_utils/Utils';
import 'css!Profiler/profiler';

export interface IStackedBar {
   name: string;
   value: number;
   length: number;
   color: string;
}

interface IFormattedStackedBar {
   caption: string;
   length: number;
   color: string;
}

interface IOptions extends IControlOptions {
   bars: IStackedBar[];
}

class StackedBar extends Control<IOptions> {
   protected _template: TemplateFunction = template;
   protected _formattedBars: IFormattedStackedBar[];

   protected _beforeMount(options: IOptions): void {
      this._formattedBars = formatBars(options.bars);
   }

   protected _beforeUpdate(newOptions: IOptions): void {
      if (this._options.bars !== newOptions.bars) {
         this._formattedBars = formatBars(newOptions.bars);
      }
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         bars: descriptor(Array).required(),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

function formatBars(bars: IStackedBar[]): IFormattedStackedBar[] {
   return bars.map((item) => {
      return {
         caption: `${item.name}: ${formatTime(item.value)}`,
         length: item.length,
         color: item.color
      };
   });
}

export default StackedBar;

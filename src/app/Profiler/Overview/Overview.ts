import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
// @ts-ignore
import * as template from 'wml!Profiler/Overview/Overview';
import 'css!Profiler/Overview/Overview';
import { descriptor } from 'Types/entity';

interface IOptions extends IControlOptions {
   mountedCount: number;
   selfUpdatedCount: number;
   parentUpdatedCount: number;
   unchangedCount: number;
   destroyedCount: number;
   screenshotURL?: string;
}

class Overview extends Control<IOptions> {
   protected _template: TemplateFunction = template;

   private __zoomImage(): void {
      if (this._options.screenshotURL) {
         chrome.tabs.create({
            url: this._options.screenshotURL
         });
      }
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         mountedCount: descriptor(Number).required(),
         selfUpdatedCount: descriptor(Number).required(),
         parentUpdatedCount: descriptor(Number).required(),
         unchangedCount: descriptor(Number).required(),
         destroyedCount: descriptor(Number).required(),
         screenshotURL: descriptor(String),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default Overview;

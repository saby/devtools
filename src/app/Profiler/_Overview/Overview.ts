import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
// @ts-ignore
import * as template from 'wml!Profiler/_Overview/Overview';
import 'css!Profiler/profiler';
import { descriptor } from 'Types/entity';

interface IOptions extends IControlOptions {
   mountedCount: number;
   selfUpdatedCount: number;
   parentUpdatedCount: number;
   unchangedCount: number;
   destroyedCount: number;
   forceUpdatedCount: number;
}

class Overview extends Control<IOptions> {
   protected _template: TemplateFunction = template;

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         mountedCount: descriptor(Number).required(),
         selfUpdatedCount: descriptor(Number).required(),
         parentUpdatedCount: descriptor(Number).required(),
         unchangedCount: descriptor(Number).required(),
         destroyedCount: descriptor(Number).required(),
         forceUpdatedCount: descriptor(Number).required(),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default Overview;

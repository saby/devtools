import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
// @ts-ignore
import * as template from 'wml!Profiler/_ReasonTag/ReasonTag';
import 'css!Profiler/profiler';
import { descriptor } from 'Types/entity';
import { getBackgroundColorBasedOnReason } from '../_utils/Utils';
import { ControlUpdateReason } from 'Extension/Plugins/Elements/ControlUpdateReason';

interface IOptions extends IControlOptions {
   updateReason?: ControlUpdateReason;
}

class ReasonTag extends Control<IOptions> {
   protected _template: TemplateFunction = template;
   protected _getColor: (
      updateReason: ControlUpdateReason
   ) => string = getBackgroundColorBasedOnReason;

   static getDefaultOptions(): Partial<IOptions> {
      return {
         updateReason: 'unchanged'
      };
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         updateReason: descriptor(String).oneOf([
            'mounted',
            'selfUpdated',
            'parentUpdated',
            'unchanged',
            'destroyed',
            'forceUpdated'
         ]),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default ReasonTag;

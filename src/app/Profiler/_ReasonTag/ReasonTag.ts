import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
import template = require('wml!Profiler/_ReasonTag/ReasonTag');
import 'css!Profiler/profiler';
import { descriptor } from 'Types/entity';
import { getBackgroundColorBasedOnReason } from '../_utils/Utils';
import { ControlUpdateReason } from 'Extension/Plugins/Elements/ControlUpdateReason';

interface IOptions extends IControlOptions {
   updateReason?: ControlUpdateReason;
}

/**
 * Renders an icon which color corresponds to the reason of the update.
 * @author Зайцев А.С.
 */
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

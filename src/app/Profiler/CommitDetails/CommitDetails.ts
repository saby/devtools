import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
// @ts-ignore
import template = require('wml!Profiler/CommitDetails/CommitDetails');
import { descriptor } from 'Types/entity';
import 'css!Profiler/CommitDetails/CommitDetails';
import { ControlUpdateReason } from 'Extension/Plugins/Elements/ControlUpdateReason';

interface IOptions extends IControlOptions {
   updateReason: ControlUpdateReason;
   changedOptions?: string[];
   changedAttributes?: string[];
}

class CommitDetails extends Control<IOptions> {
   protected _template: TemplateFunction = template;

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         updateReason: descriptor(String).required(),
         changedOptions: descriptor(Array),
         changedAttributes: descriptor(Array),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default CommitDetails;

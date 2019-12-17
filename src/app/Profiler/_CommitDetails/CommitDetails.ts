import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
// @ts-ignore
import template = require('wml!Profiler/_CommitDetails/CommitDetails');
import { descriptor } from 'Types/entity';
import 'css!Profiler/profiler';
import { ControlUpdateReason } from 'Extension/Plugins/Elements/ControlUpdateReason';
import { IWarning } from 'Profiler/_Warning/const';

export interface ICommitDetailsOptions {
   updateReason: ControlUpdateReason;
   changedOptions?: string[];
   changedAttributes?: string[];
   warnings?: IWarning[];
}

type Options = IControlOptions & ICommitDetailsOptions;

class CommitDetails extends Control<Options> {
   protected _template: TemplateFunction = template;

   static getOptionTypes(): Record<keyof Options, unknown> {
      return {
         updateReason: descriptor(String).required(),
         changedOptions: descriptor(Array),
         changedAttributes: descriptor(Array),
         warnings: descriptor(Array),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default CommitDetails;

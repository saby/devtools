import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import template = require('wml!Profiler/_CommitDetails/CommitDetails');
import { descriptor } from 'Types/entity';
import { ControlUpdateReason } from 'Extension/Plugins/Elements/ControlUpdateReason';
import { IWarning } from 'Profiler/_Warning/const';

export interface ICommitDetailsOptions {
   updateReason: ControlUpdateReason;
   changedOptions?: string[];
   changedAttributes?: string[];
   changedReactiveProps?: string[];
   warnings?: IWarning[];
}

type Options = IControlOptions & ICommitDetailsOptions;

/**
 * Renders details of the selected commit: warnings, reasons for the update.
 * @author Зайцев А.С.
 */
class CommitDetails extends Control<Options> {
   protected _template: TemplateFunction = template;

   static _theme: string[] = ['Profiler/profiler'];

   static getOptionTypes(): Record<keyof Options, unknown> {
      return {
         updateReason: descriptor(String).required(),
         changedOptions: descriptor(Array),
         changedAttributes: descriptor(Array),
         changedReactiveProps: descriptor(Array),
         warnings: descriptor(Array),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default CommitDetails;

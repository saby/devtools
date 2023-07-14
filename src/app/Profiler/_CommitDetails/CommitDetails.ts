import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import * as template from 'wml!Profiler/_CommitDetails/CommitDetails';
import { descriptor } from 'Types/entity';
import {EventUtils} from 'UI/Events';
import { ControlUpdateReason } from 'Extension/Plugins/Elements/ControlUpdateReason';
import { IWarning } from 'Profiler/_Warning/const';
import { IFrontendControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { IFrontendChangedReactiveProp } from 'Extension/Plugins/Elements/IProfilingData';
import 'css!Profiler/profiler';

export interface ICommitDetailsOptions {
   updateReason: ControlUpdateReason;
   changedOptions?: string[];
   changedAttributes?: string[];
   changedReactiveProps?: string[] | IFrontendChangedReactiveProp[];
   warnings?: IWarning[];
   logicParentId?: IFrontendControlNode['logicParentId'];
   logicParentName?: IFrontendControlNode['name'];
}

type Options = IControlOptions & ICommitDetailsOptions;

/**
 * Renders details of the selected commit: warnings, reasons for the update.
 * @author Зайцев А.С.
 */
class CommitDetails extends Control<Options> {
   protected _template: TemplateFunction = template;

   protected _notifyHandler: Function = EventUtils.tmplNotify;

   static getOptionTypes(): Record<keyof Options, unknown> {
      return {
         updateReason: descriptor(String).required(),
         changedOptions: descriptor(Array),
         changedAttributes: descriptor(Array),
         changedReactiveProps: descriptor(Array),
         warnings: descriptor(Array),
         logicParentId: descriptor(Number),
         logicParentName: descriptor(String),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default CommitDetails;

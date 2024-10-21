import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import * as template from 'wml!Profiler/_CommitDetails/ReactiveProp';
import { descriptor } from 'Types/entity';
import {
   IFrontendChangedReactiveProp,
   IStackFrame
} from 'Extension/Plugins/Elements/IProfilingData';
import 'css!Profiler/profiler';

export interface IOptions extends IControlOptions {
   reactiveProp: IFrontendChangedReactiveProp;
}

class ReactiveProp extends Control<IOptions> {
   protected _template: TemplateFunction = template;

   protected _openFile(e: Event, item: IStackFrame): void {
      // types list the callback as required, but its actually optional according to documentation
      chrome.devtools.panels.openResource(
         item.url,
         Math.max(0, item.lineNumber)
      );
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         reactiveProp: descriptor(Object).required(),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default ReactiveProp;

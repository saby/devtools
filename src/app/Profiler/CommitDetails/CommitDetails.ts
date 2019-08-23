import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
// @ts-ignore
import template = require('wml!Profiler/CommitDetails/CommitDetails');
import { descriptor } from 'Types/entity';
import 'css!Profiler/CommitDetails/CommitDetails';

interface IOptions extends IControlOptions {
   changesDescription?: {
      changedOptions?: string[];
      changedAttributes?: string[];
      isFirstRender?: boolean;
   };
}

class CommitDetails extends Control<IOptions> {
   protected _template: TemplateFunction = template;

   private __zoomImage(): void {
      if (this._options.changesDescription && this._options.changesDescription.screenshotURL) {
         chrome.tabs.create({
            url: this._options.changesDescription.screenshotURL
         });
      }
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         changesDescription: descriptor(Object),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default CommitDetails;

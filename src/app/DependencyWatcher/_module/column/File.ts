import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
import { Model } from 'Types/entity';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_module/column/File';

interface IOptions extends IControlOptions {
   itemData: {
      item: Model
   };
}

export default class Size extends Control<IOptions> {
   protected _template: TemplateFunction = template;
   protected __openResource(e: Event): void {
      e.stopPropagation();
      // the third argument is a callback and it is actually optional
      // @ts-ignore
      chrome.devtools.panels.openResource(
         this._options.itemData.item.get('path'),
         1
      );
   }
}

import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
import { Model } from 'Types/entity';
import template = require('wml!DependencyWatcher/_module/column/File');

interface IOptions extends IControlOptions {
   itemData: {
      item: Model;
   };
}

/**
 * Button that takes the filename and opens the file in the native "Sources" tab on click.
 * @author Зайцев А.С.
 */
export default class File extends Control<IOptions> {
   protected _template: TemplateFunction = template;
   protected __openResource(e: Event, item: Model): void {
      e.stopPropagation();
      const path: string = item.get('path');
      if (path.includes('.js')) {
         this._notify('openSource', [item.get('itemId')], { bubbling: true });
      } else {
         // the third argument is a callback and it is actually optional
         chrome.devtools.panels.openResource(path, 1);
      }
   }
}

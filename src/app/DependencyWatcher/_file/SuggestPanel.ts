import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!DependencyWatcher/_file/SuggestPanel');
import { ITransportFile } from 'Extension/Plugins/DependencyWatcher/IFile';

/**
 * Suggest panel of the "Dependencies" tab.
 * @author Зайцев А.С.
 */
export class SuggestPanel extends Control {
   protected readonly _template: TemplateFunction = template;
   protected readonly _navigation: object = {
      source: 'page',
      view: 'infinity',
      sourceConfig: {
         pageSize: 50,
         page: 0,
         mode: 'totalCount'
      }
   };
   protected _sorting: Array<Partial<
      Record<keyof ITransportFile, 'ASC' | 'DESC'>
   >> = [{ size: 'ASC' }];
}
export default SuggestPanel;

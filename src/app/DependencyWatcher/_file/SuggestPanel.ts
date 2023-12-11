import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!DependencyWatcher/_file/SuggestPanel';
import {
   INavigationOptionValue,
   IBasePageSourceConfig
} from 'Controls/interface';

/**
 * Suggest panel of the "Dependencies" tab.
 * @author Зайцев А.С.
 */
export class SuggestPanel extends Control {
   protected readonly _template: TemplateFunction = template;
   protected readonly _navigation: INavigationOptionValue<
      IBasePageSourceConfig
   > = {
      source: 'page',
      view: 'infinity',
      sourceConfig: {
         pageSize: 50,
         page: 0
      }
   };
}
export default SuggestPanel;

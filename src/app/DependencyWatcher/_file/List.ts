import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
import * as template from 'wml!DependencyWatcher/_file/List';
import { columns } from './columns';
import { headers } from './header';
import { ITransportFile } from 'Extension/Plugins/DependencyWatcher/IFile';
import { IHeaders } from '../interface/IHeaders';
import { IColumn } from 'Controls/grid';
import {
   INavigationPageSourceConfig,
   INavigationOptionValue
} from 'Controls/_interface/INavigation';

type Sorting = Partial<Record<keyof ITransportFile, 'ASC' | 'DESC'>>[];
interface IOptions extends IControlOptions {
   columns: IColumn[];
   headers: IHeaders<ITransportFile>;
   navigation: INavigationOptionValue<INavigationPageSourceConfig>;
   sorting: Sorting;
}

/**
 * List in the filter panel of the "Dependencies" tab.
 * @author Зайцев А.С.
 */
export class List extends Control<IOptions> {
   protected readonly _template: TemplateFunction = template;
   protected _sorting?: Sorting;
   protected _beforeMount(options: IOptions): void {
      this._sorting = options.sorting;
   }

   static getDefaultOptions(): Partial<IOptions> {
      return {
         headers,
         columns
      };
   }
}

Object.defineProperty(List, 'defaultProps', {
   enumerable: true,
   configurable: true,

   get(): object {
      return List.getDefaultOptions();
   }
});

export default List;

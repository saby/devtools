import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
import template = require('wml!DependencyWatcher/_file/List');
import { columns } from './columns';
import { headers } from './header';
import { ITransportFile } from 'Extension/Plugins/DependencyWatcher/IFile';
import { IHeaders } from '../interface/IHeaders';
import { IColumns } from '../interface/IColumn';

type Sorting = Array<Partial<Record<keyof ITransportFile, 'ASC' | 'DESC'>>>;
interface IOptions extends IControlOptions {
   columns: IColumns<ITransportFile>;
   headers: IHeaders<ITransportFile>;
   navigation: object;
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
export default List;

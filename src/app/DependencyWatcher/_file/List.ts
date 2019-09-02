import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_file/List';
import { navigation } from './navigation';
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

export class List extends Control<IOptions> {
   protected readonly _template: TemplateFunction = template;
   protected _column: IColumns<ITransportFile>;
   protected _headers: IHeaders<ITransportFile>;
   protected _navigation: object;
   protected _sorting?: Sorting;
   protected _beforeMount(options: IOptions): void {
      // TODO: скорее всего здесь перекладывание на инстанс не нужно
      this._navigation = options.navigation;
      this._headers = options.headers;
      this._column = options.columns;
      this._sorting = options.sorting;
   }

   static getDefaultOptions(): Partial<IOptions> {
      return {
         navigation,
         headers,
         columns,
         sorting: [{ size: 'ASC' }]
      };
   }
}
export default List;

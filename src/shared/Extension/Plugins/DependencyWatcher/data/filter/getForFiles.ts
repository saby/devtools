import { FilterFunction, FilterFunctionGetter } from './Filter';

interface IWithFileId {
   fileId?: number;
}

export let getForFiles: FilterFunctionGetter<
   number[] | undefined,
   IWithFileId
> = (keys?: number[]): FilterFunction<IWithFileId> => {
   /*
    * из-за того что resetValue у фильтра не сбрасывается в undefined, пришлось поставить там null,
    * но при этом надо не фильтровать
    * TODO: попробовать убрать костыль
    * https://online.sbis.ru/opendoc.html?guid=e8a934bb-533c-4506-aab9-d4e7a0e9d55b
    */
   if (!keys || !keys.length || !Array.isArray(keys)) {
      return () => true;
   }
   return (item: IWithFileId) => {
      return keys.includes(item.fileId as number);
   };
};

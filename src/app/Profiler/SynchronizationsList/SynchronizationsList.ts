import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import { descriptor } from 'Types/entity';
import { Memory } from 'Types/source';
// @ts-ignore
import synchronizationTemplate = require('wml!Profiler/SynchronizationsList/synchronizationTemplate');
// @ts-ignore
import template = require('wml!Profiler/SynchronizationsList/SynchronizationsList');
import { getBackgroundColorBasedOnTiming } from '../Utils';

interface ISynchronizationsList {
   id: string;
   selfDuration: number;
}

interface IOptions extends IControlOptions {
   synchronizations: ISynchronizationsList[];
   markedKey: string;
   filter: (item: ISynchronizationsList) => boolean;
}

// TODO: копипаста в RankedView
function getDataWithLengths(
   initialData: Array<{ selfDuration: number }>
): Array<{ selfDuration: number; length: number; barColor: string }> {
   const maxDuration = initialData.reduce(
      (max, { selfDuration }) => Math.max(max, selfDuration),
      0
   );
   return initialData.map((item) => {
      return {
         ...item,
         barColor: getBackgroundColorBasedOnTiming(
            item.selfDuration / maxDuration
         ),
         length: (item.selfDuration / maxDuration) * 100
      };
   });
}

class SynchronizationsList extends Control<IOptions> {
   protected _template: TemplateFunction = template;
   protected _source: Memory;
   protected _itemTemplate: TemplateFunction = synchronizationTemplate;

   constructor(options: IOptions) {
      super(options);
      this._source = new Memory({
         keyProperty: 'id',
         data: getDataWithLengths(
            options.synchronizations.filter(options.filter)
         )
      });
   }

   protected _beforeUpdate(newOptions: IOptions): void {
      if (
         this._options.filter !== newOptions.filter ||
         this._options.synchronizations !== newOptions.synchronizations
      ) {
         this._source = new Memory({
            keyProperty: 'id',
            data: getDataWithLengths(
               newOptions.synchronizations.filter(newOptions.filter)
            )
         });
      }
   }

   protected __markedKeyChanged(e: Event, id: string): void {
      this._notify('markedKeyChanged', [id]);
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         // @ts-ignore
         synchronizations: descriptor(Array).required(),
         // @ts-ignore
         markedKey: descriptor(String).required(),
         // @ts-ignore
         filter: descriptor(Function).required(),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default SynchronizationsList;

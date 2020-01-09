import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import { descriptor } from 'Types/entity';
import { Memory } from 'Types/source';
import synchronizationTemplate = require('wml!Profiler/_SynchronizationsList/synchronizationTemplate');
import template = require('wml!Profiler/_SynchronizationsList/SynchronizationsList');
import { getDataWithLengths } from '../_utils/Utils';

interface ISynchronizationsList {
   id: string;
   selfDuration: number;
}

interface IOptions extends IControlOptions {
   synchronizations: ISynchronizationsList[];
   markedKey: string;
   filter: (item: ISynchronizationsList) => boolean;
}

/**
 * Renders a flat list of synchronizations which happened during the last profiling session.
 * @author Зайцев А.С.
 */
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
         synchronizations: descriptor(Array).required(),
         markedKey: descriptor(String).required(),
         filter: descriptor(Function).required(),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default SynchronizationsList;

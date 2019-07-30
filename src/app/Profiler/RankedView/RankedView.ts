import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import { IFrontendControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { Memory } from 'Types/source';
// @ts-ignore
import template = require('wml!Profiler/RankedView/RankedView');
import { descriptor } from 'Types/entity';
// @ts-ignore
import commitTimeTemplate = require('wml!Profiler/RankedView/commitTimeTemplate');
// @ts-ignore
import reasonTemplate = require('wml!Profiler/RankedView/reasonTemplate');
import { getBackgroundColorBasedOnTiming } from '../Utils';
import { ControlUpdateReason } from '../Utils';

interface IRankedViewControlNode extends IFrontendControlNode {
   selfDuration: number;
   updateReason: ControlUpdateReason;
}

interface IOptions extends IControlOptions {
   snapshot: IRankedViewControlNode[];
   markedKey: string;
   filter: (item: IRankedViewControlNode) => boolean;
}

// TODO: копипаста в SynchronizationsList
function getDataWithLengths(
   initialData: Array<{
      selfDuration: number;
   }>
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

class RankedView extends Control<IOptions> {
   protected _template: TemplateFunction = template;

   protected _source: Memory;

   protected _columns: object[] = [
      {
         template: reasonTemplate,
         width: '30px'
      },
      {
         displayProperty: 'name',
         textOverflow: 'ellipsis'
      },
      {
         template: commitTimeTemplate
      }
   ];

   protected _sorting: object[] = [
      {
         selfDuration: 'desc'
      }
   ];

   constructor(options: IOptions) {
      super(options);
      this._source = new Memory({
         idProperty: 'id',
         data: getDataWithLengths(options.snapshot.filter(options.filter))
      });
   }

   protected _beforeUpdate(newOptions: IOptions): void {
      if (
         this._options.filter !== newOptions.filter ||
         this._options.snapshot !== newOptions.snapshot
      ) {
         this._source = new Memory({
            idProperty: 'id',
            data: getDataWithLengths(
               newOptions.snapshot.filter(newOptions.filter)
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
         snapshot: descriptor(Array).required(),
         // @ts-ignore
         markedKey: descriptor(String).required(),
         // @ts-ignore
         filter: descriptor(Function).required(),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default RankedView;

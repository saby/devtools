import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import { IFrontendControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { Memory } from 'Types/source';
import * as template from 'wml!Profiler/_RankedView/RankedView';
import { descriptor, Model } from 'Types/entity';
import { RecordSet } from 'Types/collection';
import * as groupTemplate from 'wml!Profiler/_RankedView/groupTemplate';
import { View } from 'Controls/grid';
import { getDataWithLengths } from '../_utils/Utils';
import { ControlUpdateReason } from 'Extension/Plugins/Elements/ControlUpdateReason';

interface IRankedViewControlNode extends IFrontendControlNode {
   selfDuration: number;
   updateReason: ControlUpdateReason;
}

interface IOptions extends IControlOptions {
   snapshot: IRankedViewControlNode[];
   markedKey: IFrontendControlNode['id'];
   filter: {
      name: string;
      minDuration: number;
      displayReasons: ControlUpdateReason[];
   };
   itemsReadyCallback: (items: RecordSet) => void;
}

function applyFilter(
   initialData: IOptions['snapshot'],
   filter: IOptions['filter']
): IOptions['snapshot'] {
   return initialData.filter(
      (item) =>
         item.selfDuration >= filter.minDuration &&
         filter.displayReasons.indexOf(item.updateReason) !== -1
   );
}

function groupByReason(item: Model): ControlUpdateReason {
   return item.get('updateReason') as ControlUpdateReason;
}

/**
 * Renders a flat list of commits which happened during the last profiling session.
 * @author Зайцев А.С.
 */
class RankedView extends Control<IOptions> {
   protected _template: TemplateFunction = template;

   protected _source: Memory;

   protected _sorting: object[] = [
      {
         selfDuration: 'desc'
      }
   ];

   protected _groupingCallback: (
      item: Model
   ) => ControlUpdateReason = groupByReason;

   protected _groupTemplate: TemplateFunction = groupTemplate;

   protected _children: {
      grid: View;
   };

   constructor(options: IOptions) {
      super(options);
      this._source = new Memory({
         keyProperty: 'id',
         data: getDataWithLengths(applyFilter(options.snapshot, options.filter))
      });
   }

   protected _beforeUpdate(newOptions: IOptions): void {
      if (
         this._options.filter !== newOptions.filter ||
         this._options.snapshot !== newOptions.snapshot
      ) {
         this._source = new Memory({
            keyProperty: 'id',
            data: getDataWithLengths(
               applyFilter(newOptions.snapshot, newOptions.filter)
            )
         });
      }
   }

   protected _afterUpdate(oldOptions: IOptions): void {
      if (oldOptions.markedKey !== this._options.markedKey) {
         this._children.grid.scrollToItem(this._options.markedKey);
      }
   }

   protected _markedKeyChanged(e: Event, id: string): void {
      this._notify('markedKeyChanged', [id]);
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         snapshot: descriptor(Array).required(),
         markedKey: descriptor(Number).required(),
         filter: descriptor(Object).required(),
         itemsReadyCallback: descriptor(Function),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default RankedView;

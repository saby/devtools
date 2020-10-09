import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import { IFrontendControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { Memory } from 'Types/source';
import * as template from 'wml!Profiler/_RankedView/RankedView';
import { descriptor, Model } from 'Types/entity';
import { RecordSet } from 'Types/collection';
import * as groupTemplate from 'wml!Profiler/_RankedView/groupTemplate';
import { View } from 'Controls/grid';
import {
   DurationName,
   formatDurationsForStackedBars
} from '../_utils/formatDurationsForStackedBars';
import { ControlUpdateReason } from 'Extension/Plugins/Elements/ControlUpdateReason';
import {
   INavigationOptionValue,
   INavigationPageSourceConfig
} from 'Controls/_interface/INavigation';

interface IRankedViewControlNode extends IFrontendControlNode {
   selfDuration: number;
   lifecycleDuration: number;
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

/**
 * Renders a flat list of commits which happened during the last profiling session.
 * @author Зайцев А.С.
 */
class RankedView extends Control<IOptions> {
   protected _template: TemplateFunction = template;

   protected _source: Memory;

   protected _groupTemplate: TemplateFunction = groupTemplate;

   protected _children: {
      grid: View;
   };

   protected readonly _navigation: INavigationOptionValue<
      INavigationPageSourceConfig
   > = {
      source: 'page',
      view: 'infinity',
      sourceConfig: {
         pageSize: 50,
         page: 0,
         hasMore: false
      }
   };

   private renderedDurations: DurationName[] = [
      'renderDuration',
      'lifecycleDuration'
   ];

   constructor(options: IOptions) {
      super(options);
      this._source = this.getSource(options);
   }

   protected _beforeUpdate(newOptions: IOptions): void {
      if (
         this._options.filter !== newOptions.filter ||
         this._options.snapshot !== newOptions.snapshot
      ) {
         this._source = this.getSource(newOptions);
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

   private getSource(options: IOptions): Memory {
      /*
      Virtual scroll and groups don't work well together.
      If the items aren't sorted by group the list can render one group and then remove it because
      previous group has gotten more items.
      So we have to group and sort items here to prevent that.
       */
      const groups: Map<
         ControlUpdateReason,
         IRankedViewControlNode[]
      > = new Map();
      applyFilter(options.snapshot, options.filter).forEach((item) => {
         const renderDuration = item.selfDuration - item.lifecycleDuration;
         const newItem = {
            ...item,
            renderDuration
         };
         const group = groups.get(newItem.updateReason);
         if (group) {
            group.push(newItem);
         } else {
            groups.set(newItem.updateReason, [newItem]);
         }
      });

      const groupedData = Array.from(groups.values()).reduce(
         (acc, group) =>
            acc.concat(group.sort((a, b) => b.selfDuration - a.selfDuration)),
         []
      );

      return new Memory({
         keyProperty: 'id',
         data: formatDurationsForStackedBars(
            groupedData,
            this.renderedDurations,
            'durationName'
         )
      });
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

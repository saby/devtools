import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import { descriptor } from 'Types/entity';
import {
   IControlNode,
   IFrontendControlNode
} from 'Extension/Plugins/Elements/IControlNode';
import 'css!Profiler/Flamegraph/Flamegraph';
import { getBackgroundColor, getWidth } from './Utils';
// @ts-ignore
import template = require('wml!Profiler/Flamegraph/Flamegraph');

interface IFlamegraphControlNode extends IFrontendControlNode {
   selfDuration: number;
   actualDuration: number;
   didRender: boolean;
}

interface IOptions extends IControlOptions {
   snapshot: IFlamegraphControlNode[];
   markedKey?: string;
}

interface INodeItemData {
   id: string;
   style: string;
   tooltip: string;
   leftOffset: number;
   width: number;
   isSelected: boolean;
   parentId?: string;
   caption?: string;
}

const MIN_WIDTH_WITH_CAPTION = 30;
const PADDING_WIDTH = 8;
const MARGIN_OF_ERROR = 20;
const LETTER_WIDTH = 6;
const ROW_HEIGHT = 20;
const MIN_WIDTH = 5;
const ARROWS = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'];

function getTreeDuration(actualDuration: number, selfDuration: number): number {
   if (actualDuration === selfDuration) {
      return actualDuration;
   } else {
      return actualDuration - selfDuration;
   }
}

function getMaxTreeDuration(
   snapshot: IOptions['snapshot'],
   markedKey?: string
): number {
   if (markedKey) {
      const selectedNode = snapshot.find(({ id }) => id === markedKey);

      if (selectedNode) {
         return getTreeDuration(
            selectedNode.actualDuration,
            selectedNode.selfDuration
         );
      }
   }

   return snapshot.reduce((acc, { depth, actualDuration, selfDuration }) => {
      if (depth === 0) {
         return acc + getTreeDuration(actualDuration, selfDuration);
      } else {
         return acc;
      }
   }, 0);
}

function getMaxSelfDuration(snapshot: IOptions['snapshot']): number {
   return snapshot
      .filter(({ didRender }) => didRender)
      .reduce(
         (maxDuration, { selfDuration }) => Math.max(maxDuration, selfDuration),
         0
      );
}

function getSubtreeWithSelectedNode(
   snapshot: IOptions['snapshot'],
   markedKey?: string
): IOptions['snapshot'] {
   const selectedNodeIndex = snapshot.findIndex(({ id }) => id === markedKey);

   if (selectedNodeIndex !== -1) {
      const node = snapshot[selectedNodeIndex];
      const result = [node];

      let currentParentId = node.parentId;
      for (let i = selectedNodeIndex; i >= 0 && currentParentId; i--) {
         if (snapshot[i].id === currentParentId) {
            currentParentId = snapshot[i].parentId;
            result.unshift(snapshot[i]);
         }
      }

      const parents = new Set();
      parents.add(node.id);
      for (let i = selectedNodeIndex; i < snapshot.length; i++) {
         if (snapshot[i].parentId && parents.has(snapshot[i].parentId)) {
            parents.add(snapshot[i].id);
            result.push(snapshot[i]);
         }
      }

      return result;
   } else {
      return snapshot;
   }
}

// TODO: то же самое есть в TimeRender
function formatTime(value: number): string {
   const SECOND = 1000;
   const PRECISION = 2;
   const roundedValue = value.toFixed(PRECISION);
   return value >= SECOND ? `${roundedValue}s` : `${roundedValue}ms`;
}

// TODO: тут actualDuration это совсем не то, она учитывает время не только обновившихся компонентов, а вообще всех
function getTooltip(
   name: string,
   selfDuration: number,
   actualDuration: number,
   didRender: boolean
): string {
   if (!didRender) {
      return name;
   }

   return `${name} ${formatTime(selfDuration)} of ${formatTime(
      actualDuration
   )}`;
}

function getCaption(
   width: number,
   name: string,
   selfDuration: number,
   didRender: boolean
): string {
   if (width >= MIN_WIDTH_WITH_CAPTION) {
      if (didRender) {
         const formattedTime = formatTime(selfDuration);

         // show time in caption only if it can fit without overflowing
         if (
            name.length * LETTER_WIDTH +
               formattedTime.length * LETTER_WIDTH +
               PADDING_WIDTH +
               MARGIN_OF_ERROR <
            width
         ) {
            return `${name} (${formattedTime})`;
         }
      }
      return name;
   }
   return '';
}

function getLeftOffset(
   previousNodesOnThisDepth: INodeItemData[],
   depth: number,
   parentId: IControlNode['parentId'],
   previousItemData?: INodeItemData[]
): number {
   let offset = 0;

   // TODO: это сжирает довольно много времени
   const elementsWithTheSameParent = previousNodesOnThisDepth.filter(
      (element) => {
         /**
          * TODO: очередные костыли из-за кривых ключей
          * если глубина 0, то считаем, что все предыдущие элементы имеют того же родителя
          */
         if (depth === 0) {
            return true;
         }
         return element.parentId === parentId;
      }
   );

   if (elementsWithTheSameParent.length > 0) {
      const lastElement =
         elementsWithTheSameParent[elementsWithTheSameParent.length - 1];
      offset = lastElement.leftOffset + lastElement.width;
   } else {
      if (parentId && previousItemData) {
         const parent = previousItemData.find(
            (element) => element.id === parentId
         ) as INodeItemData;
         offset = parent.leftOffset;
      }
   }

   return offset;
}

function getItemDataForDepth(
   snapshot: IOptions['snapshot'],
   maxTreeDuration: number,
   maxSelfDuration: number,
   containerWidth: number,
   depth: number,
   topOffset: number,
   markedKey?: string,
   previousItemData?: INodeItemData[]
): INodeItemData[] {
   const elementsOnThisDepth = snapshot.filter(
      (element) => element.depth === depth
   );
   const result: INodeItemData[] = [];

   elementsOnThisDepth.forEach(
      ({ id, selfDuration, actualDuration, name, parentId, didRender }) => {
         const width = getWidth(
            getTreeDuration(actualDuration, selfDuration),
            maxTreeDuration,
            containerWidth
         );
         const leftOffset = getLeftOffset(
            result,
            depth,
            parentId,
            previousItemData
         );

         result.push({
            id,
            parentId,
            leftOffset,
            width,
            style: `width: ${width}px; background-color: ${getBackgroundColor(
               selfDuration / maxSelfDuration,
               didRender
            )}; left: ${leftOffset}px; top: ${topOffset}px;`,
            tooltip: getTooltip(name, selfDuration, actualDuration, didRender),
            caption: getCaption(width, name, selfDuration, didRender),
            isSelected: id === markedKey
         });
      }
   );

   return result;
}

function convertSnapshotToItemData(
   snapshot: IOptions['snapshot'],
   maxTreeDuration: number,
   maxSelfDuration: number,
   containerWidth: number,
   markedKey?: string
): INodeItemData[][] {
   let minDepth = snapshot[0].depth;
   let maxDepth = 0;

   snapshot.forEach(({ depth }) => {
      minDepth = Math.min(minDepth, depth);
      maxDepth = Math.max(maxDepth, depth);
   });

   const result: INodeItemData[][] = [];
   let topOffset = 0;

   for (let currentDepth = minDepth; currentDepth <= maxDepth; currentDepth++) {
      result.push(
         getItemDataForDepth(
            snapshot,
            maxTreeDuration,
            maxSelfDuration,
            containerWidth,
            currentDepth,
            topOffset,
            markedKey,
            result.length > 0 ? result[currentDepth - 1] : undefined
         )
      );
      topOffset += ROW_HEIGHT;
   }

   return result.map((itemDataForDepth) =>
      itemDataForDepth.filter(({ width }) => width > MIN_WIDTH)
   );
}

class Flamegraph extends Control<IOptions> {
   protected _template: TemplateFunction = template;
   protected _maxTreeDuration: number = 0;
   protected _maxSelfDuration: number = 0;
   protected _containerWidth: number = 0;
   protected _depthToItemData: INodeItemData[][] = [];

   protected _afterMount(): void {
      this._containerWidth = this._container.clientWidth;
      this._updateGraph(this._options);
   }

   protected _beforeUpdate(newOptions: IOptions): void {
      // TODO: нормально реагировать на изменение ширины
      const currentWidth = this._container.clientWidth;
      const snapshotChanged = this._options.snapshot !== newOptions.snapshot;
      const widthChanged = this._containerWidth !== currentWidth;
      const markedKeyChanged = this._options.markedKey !== newOptions.markedKey;
      const shouldRedrawGraph =
         snapshotChanged || widthChanged || markedKeyChanged;

      if (widthChanged) {
         this._containerWidth = currentWidth;
      }

      if (shouldRedrawGraph) {
         this._updateGraph(newOptions);
      }
   }

   // TODO: реагировать на снятие выделения
   protected _onMarkedKeyChanged(e: Event, id?: string): void {
      e.stopPropagation();
      this._notify('markedKeyChanged', [id]);
   }

   protected _updateGraph(options: IOptions): void {
      const filteredSnapshot = getSubtreeWithSelectedNode(
         options.snapshot,
         options.markedKey
      );
      this._maxTreeDuration = getMaxTreeDuration(
         filteredSnapshot,
         options.markedKey
      );
      this._maxSelfDuration = getMaxSelfDuration(filteredSnapshot);

      this._depthToItemData = convertSnapshotToItemData(
         filteredSnapshot,
         this._maxTreeDuration,
         this._maxSelfDuration,
         this._containerWidth,
         options.markedKey
      );
   }

   protected _onKeyDown(e: {
      nativeEvent: KeyboardEvent;
      stopPropagation: Event['stopPropagation'];
   }): void {
      const key = e.nativeEvent.key;
      if (ARROWS.indexOf(key) !== -1 && this._options.markedKey) {
         const selectedItem = this._options.snapshot.find(
            ({ id }) => id === this._options.markedKey
         );
         if (selectedItem) {
            e.stopPropagation();
            switch (key) {
               case 'ArrowDown':
                  this.__handleArrowDown(selectedItem);
                  break;
               case 'ArrowLeft':
                  this.__handleArrowLeft(selectedItem);
                  break;
               case 'ArrowRight':
                  this.__handleArrowRight(selectedItem);
                  break;
               case 'ArrowUp':
                  this.__handleArrowUp(selectedItem);
                  break;
            }
         }
      }
   }

   private __handleArrowDown(selectedItem: IFlamegraphControlNode): void {
      const firstChild = this._depthToItemData[selectedItem.depth + 1].find(
         ({ parentId }) => parentId === selectedItem.id
      );
      if (firstChild) {
         this._notify('markedKeyChanged', [firstChild.id]);
      }
   }

   private __handleArrowUp(selectedItem: IFlamegraphControlNode): void {
      const parent = this._depthToItemData[selectedItem.depth - 1].find(
         ({ id }) => id === selectedItem.parentId
      );
      if (parent) {
         this._notify('markedKeyChanged', [parent.id]);
      }
   }

   private __handleArrowLeft(selectedItem: IFlamegraphControlNode): void {
      const itemsOnTheSameDepth = this._options.snapshot.filter(
         ({ depth }) => depth === selectedItem.depth
      );
      const selectedItemIndex = itemsOnTheSameDepth.findIndex(
         ({ id }) => id === selectedItem.id
      );
      if (
         selectedItemIndex !== 0 &&
         itemsOnTheSameDepth[selectedItemIndex - 1].parentId ===
            selectedItem.parentId
      ) {
         this._notify('markedKeyChanged', [
            itemsOnTheSameDepth[selectedItemIndex - 1].id
         ]);
      }
   }

   private __handleArrowRight(selectedItem: IFlamegraphControlNode): void {
      const itemsOnTheSameDepth = this._options.snapshot.filter(
         ({ depth }) => depth === selectedItem.depth
      );
      const selectedItemIndex = itemsOnTheSameDepth.findIndex(
         ({ id }) => id === selectedItem.id
      );
      if (
         selectedItemIndex !== itemsOnTheSameDepth.length - 1 &&
         itemsOnTheSameDepth[selectedItemIndex + 1].parentId ===
            selectedItem.parentId
      ) {
         this._notify('markedKeyChanged', [
            itemsOnTheSameDepth[selectedItemIndex + 1].id
         ]);
      }
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         // @ts-ignore
         snapshot: descriptor(Array).required(),
         // @ts-ignore
         markedKey: descriptor(String),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default Flamegraph;

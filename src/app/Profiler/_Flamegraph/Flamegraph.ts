import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import { descriptor } from 'Types/entity';
import { IFrontendControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { getWidth } from './Utils';
import { formatTime, getBackgroundClassBasedOnReason } from '../_utils/Utils';
import * as template from 'wml!Profiler/_Flamegraph/Flamegraph';
import { ControlUpdateReason } from 'Extension/Plugins/Elements/ControlUpdateReason';
import { WARNING_NAMES } from 'Profiler/_Warning/const';
import 'css!Profiler/profiler';

export interface IFlamegraphControlNode extends IFrontendControlNode {
   selfDuration: number;
   actualDuration: number;
   actualBaseDuration: number;
   lifecycleDuration: number;
   updateReason: ControlUpdateReason;
   hasChangesInSubtree: boolean;
   warnings?: WARNING_NAMES[];
}

interface IOptions extends IControlOptions {
   snapshot: IFlamegraphControlNode[];
   markedKey?: IFrontendControlNode['id'];
}

interface INodeItemData {
   id: IFrontendControlNode['id'];
   style: string;
   tooltip: string;
   leftOffset: number;
   width: number;
   isSelected: boolean;
   class: string;
   warnings?: WARNING_NAMES[];
   parentId?: IFrontendControlNode['parentId'];
   caption?: string;
}

const MIN_WIDTH_WITH_CAPTION = 30;
const PADDING_WIDTH = 8;
const MARGIN_OF_ERROR = 20;
const LETTER_WIDTH = 6;
const ROW_HEIGHT = 20;
const MIN_WIDTH = 5;
const ARROWS = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'];

function getMaxTreeDuration(
   snapshot: IOptions['snapshot'],
   markedKey?: IOptions['markedKey']
): number {
   if (typeof markedKey !== 'undefined') {
      const selectedNode = snapshot.find(({ id }) => id === markedKey);

      if (selectedNode) {
         return selectedNode.actualBaseDuration;
      }
   }

   return snapshot.reduce((acc, { depth, actualBaseDuration }) => {
      if (depth === 0) {
         return acc + actualBaseDuration;
      } else {
         return acc;
      }
   }, 0);
}

function getMaxSelfDuration(snapshot: IOptions['snapshot']): number {
   return snapshot
      .filter(({ updateReason }) => updateReason !== 'unchanged')
      .reduce(
         (maxDuration, { selfDuration }) => Math.max(maxDuration, selfDuration),
         0
      );
}

function getSubtreeWithSelectedNode(
   snapshot: IOptions['snapshot'],
   markedKey?: IOptions['markedKey']
): IOptions['snapshot'] {
   const selectedNodeIndex = snapshot.findIndex(({ id }) => id === markedKey);

   if (selectedNodeIndex !== -1) {
      const node = snapshot[selectedNodeIndex];
      const result = [node];

      let currentParentId = node.parentId;
      for (
         let i = selectedNodeIndex;
         i >= 0 && typeof currentParentId !== 'undefined';
         i--
      ) {
         if (snapshot[i].id === currentParentId) {
            currentParentId = snapshot[i].parentId;
            result.unshift(snapshot[i]);
         }
      }

      const parents = new Set();
      parents.add(node.id);
      for (let i = selectedNodeIndex; i < snapshot.length; i++) {
         if (
            typeof snapshot[i].parentId !== 'undefined' &&
            parents.has(snapshot[i].parentId)
         ) {
            parents.add(snapshot[i].id);
            result.push(snapshot[i]);
         }
      }

      return result;
   } else {
      return snapshot;
   }
}

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
   actualDuration: number,
   didRender: boolean
): string {
   if (width >= MIN_WIDTH_WITH_CAPTION) {
      if (didRender) {
         const formattedSelfDuration = formatTime(selfDuration);
         const formattedActualDuration = formatTime(actualDuration);
         const fullCaption = `${formattedSelfDuration} of ${formattedActualDuration}`;

         // show time in caption only if it can fit without overflowing
         if (
            name.length * LETTER_WIDTH +
               fullCaption.length * LETTER_WIDTH +
               PADDING_WIDTH +
               MARGIN_OF_ERROR <
            width
         ) {
            return `${name} (${fullCaption})`;
         } else if (
            name.length * LETTER_WIDTH +
               formattedSelfDuration.length * LETTER_WIDTH +
               PADDING_WIDTH +
               MARGIN_OF_ERROR <
            width
         ) {
            return `${name} (${formattedSelfDuration})`;
         }
      }
      return name;
   }
   return '';
}

function getLeftOffset(
   previousNodesOnThisDepth: INodeItemData[],
   depth: number,
   parentId: IFrontendControlNode['parentId'],
   idToIndexMap?: Map<IFrontendControlNode['id'], number>,
   previousItemData?: INodeItemData[]
): number {
   let offset = 0;

   let lastElementWithTheSameParent;
   if (previousNodesOnThisDepth.length > 0) {
      if (
         previousNodesOnThisDepth[previousNodesOnThisDepth.length - 1]
            .parentId === parentId
      ) {
         lastElementWithTheSameParent =
            previousNodesOnThisDepth[previousNodesOnThisDepth.length - 1];
      }
   }

   if (lastElementWithTheSameParent) {
      offset =
         lastElementWithTheSameParent.leftOffset +
         lastElementWithTheSameParent.width;
   } else {
      if (parentId && previousItemData && idToIndexMap) {
         const index = idToIndexMap.get(parentId);
         if (typeof index === 'number' && previousItemData[index]) {
            offset = previousItemData[index].leftOffset;
         }
      }
   }

   return offset;
}

function getIdToIndexMap(
   previousItemData?: INodeItemData[]
): Map<IFrontendControlNode['id'], number> {
   const result = new Map();

   if (previousItemData) {
      previousItemData.forEach(({ id }, index) => {
         result.set(id, index);
      });
   }

   return result;
}

function getItemDataForDepth(
   snapshot: IOptions['snapshot'],
   maxTreeDuration: number,
   maxSelfDuration: number,
   containerWidth: number,
   depth: number,
   topOffset: number,
   markedKey?: IOptions['markedKey'],
   previousItemData?: INodeItemData[]
): INodeItemData[] {
   const elementsOnThisDepth = snapshot.filter(
      (element) => element.depth === depth
   );
   const result: INodeItemData[] = [];
   const idToIndexMap = getIdToIndexMap(previousItemData);

   elementsOnThisDepth.forEach(
      ({
         id,
         selfDuration,
         actualDuration,
         actualBaseDuration,
         name,
         parentId,
         updateReason,
         warnings,
         hasChangesInSubtree
      }) => {
         const width = getWidth(
            actualBaseDuration,
            maxTreeDuration,
            containerWidth
         );

         if (width < MIN_WIDTH) {
            return;
         }

         const leftOffset = getLeftOffset(
            result,
            depth,
            parentId,
            idToIndexMap,
            previousItemData
         );

         const didRender = updateReason !== 'unchanged';

         result.push({
            id,
            parentId,
            leftOffset,
            width,
            style: `width: ${width}px; left: ${leftOffset}px; top: ${topOffset}px;`,
            class: getBackgroundClassBasedOnReason(
               updateReason,
               hasChangesInSubtree
            ),
            tooltip: getTooltip(name, selfDuration, actualDuration, didRender),
            caption: getCaption(
               width,
               name,
               selfDuration,
               actualDuration,
               didRender
            ),
            isSelected: id === markedKey,
            warnings
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
   markedKey?: IOptions['markedKey']
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

   return result;
}

/**
 * Renders commits which happened during the last profiling session as a flamegraph.
 * @author Зайцев А.С.
 */
class Flamegraph extends Control<IOptions> {
   protected _template: TemplateFunction = template;
   protected _maxTreeDuration: number = 0;
   protected _maxSelfDuration: number = 0;
   protected _containerWidth: number = 0;
   protected _depthToItemData: INodeItemData[][] = [];
   protected _shouldRestoreFocus: boolean = false;

   protected _afterMount(): void {
      this._containerWidth = this._container.clientWidth;
      this._updateGraph(this._options);
   }

   protected _beforeUpdate(newOptions: IOptions): void {
      const snapshotChanged = this._options.snapshot !== newOptions.snapshot;
      const markedKeyChanged = this._options.markedKey !== newOptions.markedKey;
      const shouldRedrawGraph = snapshotChanged || markedKeyChanged;

      if (shouldRedrawGraph) {
         this._updateGraph(newOptions);
      }
   }

   protected _afterUpdate(oldOptions: IOptions): void {
      if (
         typeof this._options.markedKey !== 'undefined' &&
         oldOptions.markedKey !== this._options.markedKey &&
         this._children[this._options.markedKey]
      ) {
         (this._children[
            this._options.markedKey
         ] as HTMLElement).scrollIntoView({
            block: 'nearest',
            inline: 'nearest'
         });
         if (this._shouldRestoreFocus) {
            this._shouldRestoreFocus = false;

            (this._children[this._options.markedKey] as HTMLElement).focus();
         }
      }

      // TODO: попробовать перейти на схему с controlResize
      const currentWidth = this._container.clientWidth;

      if (this._containerWidth !== currentWidth) {
         this._containerWidth = currentWidth;
         this._updateGraph(this._options);
      }
   }

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
      if (typeof this._options.markedKey !== 'undefined') {
         const key = e.nativeEvent.key;
         if (ARROWS.indexOf(key) !== -1) {
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

         if (key === 'Escape') {
            e.stopPropagation();
            this._notify('markedKeyChanged');
         }
      }
   }

   private __handleArrowDown(selectedItem: IFlamegraphControlNode): void {
      const firstChild = this._options.snapshot.find(
         ({ parentId }) => parentId === selectedItem.id
      );
      if (firstChild) {
         this.__changeMarkedKeyAfterKeydown(firstChild.id);
      }
   }

   private __handleArrowUp(selectedItem: IFlamegraphControlNode): void {
      if (selectedItem.depth !== 0) {
         const parent = this._depthToItemData[selectedItem.depth - 1].find(
            ({ id }) => id === selectedItem.parentId
         );
         if (parent) {
            this.__changeMarkedKeyAfterKeydown(parent.id);
         }
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
         this.__changeMarkedKeyAfterKeydown(
            itemsOnTheSameDepth[selectedItemIndex - 1].id
         );
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
         this.__changeMarkedKeyAfterKeydown(
            itemsOnTheSameDepth[selectedItemIndex + 1].id
         );
      }
   }

   private __changeMarkedKeyAfterKeydown(id: IOptions['markedKey']): void {
      this._shouldRestoreFocus = true;
      this._notify('markedKeyChanged', [id]);
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         snapshot: descriptor(Array).required(),
         markedKey: descriptor(Number),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default Flamegraph;

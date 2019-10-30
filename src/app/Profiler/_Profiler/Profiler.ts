import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import { Memory } from 'Types/source';
import { Store } from 'Elements/elements';
import { IOperationEvent } from 'Extension/Plugins/Elements/IOperations';
import { ICommitDetailsOptions } from 'Profiler/_CommitDetails/CommitDetails';
import 'css!Profiler/profiler';
import Flamegraph from '../_Flamegraph/Flamegraph';
import RankedView from '../_RankedView/RankedView';
import SynchronizationsList from '../_SynchronizationsList/SynchronizationsList';
import {
   applyOperations,
   convertProfilingData,
   getChanges,
   getChangesDescription,
   getSelfDuration,
   getSynchronizationOverview
} from '../_utils/Utils';
import { OperationType } from 'Extension/Plugins/Elements/const';
import Controller from '../../Search/Controller';
import {
   IBackendProfilingData,
   IFrontendProfilingData
} from 'Extension/Plugins/Elements/IProfilingData';
import { IFrontendControlNode } from 'Extension/Plugins/Elements/IControlNode';
// @ts-ignore
import template = require('wml!Profiler/_Profiler/Profiler');
import { ControlUpdateReason } from 'Extension/Plugins/Elements/ControlUpdateReason';

interface IOptions extends IControlOptions {
   store: Store;
}

function masterFilter(item: { selfDuration: number }): boolean {
   return item.selfDuration !== 0;
}

export interface ISynchronizationOverview {
   mountedCount: number;
   selfUpdatedCount: number;
   parentUpdatedCount: number;
   unchangedCount: number;
   destroyedCount: number;
   forceUpdatedCount: number;
}

class Profiler extends Control<IOptions> {
   protected _template: TemplateFunction = template;

   protected _isProfiling: boolean = false;

   protected _didProfile: boolean = false;

   protected _profilingData: IFrontendProfilingData;

   protected _changesBySynchronization: Map<
      string,
      Profiler['_currentOperations']
   > = new Map();

   protected _elementsBySynchronization: Map<
      string,
      Store['_elements']
   > = new Map();

   protected _destroyedCountBySynchronization: Map<string, number> = new Map();

   protected _snapshotBySynchronization: Map<
      string,
      Flamegraph['_options']['snapshot']
   > = new Map();

   protected _elementsSnapshot: Store['_elements'] = [];

   protected _snapshot?: Flamegraph['_options']['snapshot'];

   protected _synchronizations?: SynchronizationsList['_options']['synchronizations'];

   protected _synchronizationOverview?: ISynchronizationOverview;

   protected _masterFilter: SynchronizationsList['_options']['filter'] = masterFilter;

   protected _detailFilter: RankedView['_options']['filter'] = {
      minDuration: 0,
      name: '',
      displayReasons: ['mounted', 'selfUpdated', 'parentUpdated', 'forceUpdated']
   };

   protected _currentOperations: Array<IOperationEvent['args']>;

   protected _radioGroupSource: Memory = new Memory({
      keyProperty: 'title',
      data: [
         {
            title: 'Flamegraph'
         },
         {
            title: 'Ranked'
         }
      ]
   });

   protected _selectedTab: string = 'Flamegraph';

   protected _selectedSynchronizationId: string = '';

   protected _selectedCommitId?: IFrontendControlNode['id'];

   protected _selectedCommitChanges?: ICommitDetailsOptions;

   protected _searchValue: string = '';

   protected _searchController: Controller = new Controller('name');

   protected _lastFoundItemIndex: number = 0;

   protected _searchTotal: number = 0;

   constructor(options: IOptions) {
      super(options);
      options.store.addListener(
         'profilingData',
         this.__setProfilingData.bind(this)
      );
      options.store.addListener('operation', this.__onOperation.bind(this));
      options.store.addListener(
         'endSynchronization',
         this.__onEndSynchronization.bind(this)
      );
      options.store.addListener(
         'profilingStatus',
         this.__onProfilingStatusChanged.bind(this)
      );
      options.store.toggleDevtoolsOpened(true);
      options.store.dispatch('getProfilingStatus');
   }

   private __setProfilingData(profilingData: IBackendProfilingData): void {
      this._didProfile = true;

      this._profilingData = convertProfilingData(profilingData);
      this._synchronizations = profilingData.syncList.map(
         ([id, { selfDuration }]) => {
            return {
               id,
               selfDuration
            };
         }
      );

      if (profilingData.syncList[0]) {
         this._selectedSynchronizationId = profilingData.syncList[0][0];

         this.__setSynchronization(this._selectedSynchronizationId);
      }
   }

   private __setSynchronization(synchronizationKey: string): void {
      let snapshot = this._snapshotBySynchronization.get(synchronizationKey);
      if (!snapshot) {
         const changes = getChanges(this._profilingData, synchronizationKey);
         const elements = this.__getElementsBySynchronization(
            synchronizationKey
         );

         /**
          * Here we're adding profiling data to the elements: timings, update reason, dom changes, etc.
          * Because timings and dom changes should bubble, we're traversing in reverse order.
          */
         const elementsWithProfilingData: Flamegraph['_options']['snapshot'] = [];
         const parentsOfChangedElements: Set<
            IFrontendControlNode['id']
         > = new Set();
         const parentsDuration: Map<
            IFrontendControlNode['id'],
            {
               actualDuration: number;
               actualBaseDuration: number;
            }
         > = new Map();
         for (let i = elements.length - 1; i >= 0; i--) {
            const currentItem = elements[i];
            const changesForElement = changes.get(currentItem.id);
            const selfDuration = getSelfDuration(
               this._profilingData,
               synchronizationKey,
               currentItem.id
            );
            let updateReason: ControlUpdateReason = 'unchanged';
            let domChanged = false;

            if (changesForElement) {
               updateReason = changesForElement.updateReason;
               domChanged = changesForElement.domChanged;
            }

            if (parentsOfChangedElements.has(currentItem.id) || domChanged) {
               domChanged = true;
               if (typeof currentItem.parentId !== 'undefined') {
                  parentsOfChangedElements.add(currentItem.parentId);
               }
            }
            // TODO: по сути костыль, чтобы не помечать в профиле лишние элементы, как проблемные
            if (updateReason === 'unchanged') {
               domChanged = true;
            }

            const duration = parentsDuration.get(currentItem.id);
            let actualBaseDuration = selfDuration;
            let actualDuration = updateReason !== 'unchanged' ? selfDuration : 0;
            if (duration) {
               actualBaseDuration += duration.actualBaseDuration;
               actualDuration += duration.actualDuration;
            }

            if (typeof currentItem.parentId !== 'undefined') {
               const previousDuration = parentsDuration.get(
                  currentItem.parentId
               );
               if (previousDuration) {
                  previousDuration.actualBaseDuration += actualBaseDuration;
                  if (updateReason !== 'unchanged') {
                     previousDuration.actualDuration += actualDuration;
                  }
               } else {
                  parentsDuration.set(currentItem.parentId, {
                     actualBaseDuration,
                     actualDuration
                  });
               }
            }

            elementsWithProfilingData.push({
               ...currentItem,
               selfDuration,
               updateReason,
               domChanged,
               actualBaseDuration,
               actualDuration
            });
         }
         snapshot = elementsWithProfilingData.reverse();

         this._snapshotBySynchronization.set(synchronizationKey, snapshot);
      }

      this._synchronizationOverview = getSynchronizationOverview(
         snapshot,
         this._destroyedCountBySynchronization.get(synchronizationKey)
      );
      this._snapshot = snapshot;
      this.__updateSelectedCommitChanges();

      this.__updateSearch(this._searchValue);
   }

   private __updateSelectedCommitChanges(): void {
      if (typeof this._selectedCommitId === 'undefined') {
         this._selectedCommitChanges = undefined;
      } else {
         const changes = getChangesDescription(
            this._profilingData,
            this._selectedSynchronizationId,
            this._selectedCommitId
         );

         if (changes) {
            this._selectedCommitChanges = {
               updateReason: changes.updateReason,
               changedOptions: changes.changedOptions,
               changedAttributes: changes.changedAttributes
            };
         } else {
            this._selectedCommitChanges = {
               updateReason: 'unchanged'
            };
         }
      }
   }

   private __masterMarkedKeyChanged(e: Event, id: Profiler['_selectedSynchronizationId']): void {
      this._selectedSynchronizationId = id;
      this.__setSynchronization(this._selectedSynchronizationId);
   }

   private __detailMarkedKeyChanged(e: Event, id?: IFrontendControlNode['id']): void {
      this._selectedCommitId = id;
      this.__updateSelectedCommitChanges();
   }

   private __getElementsBySynchronization(
      synchronizationId: string
   ): Store['_elements'] {
      let result = this._elementsBySynchronization.get(synchronizationId);

      if (!result) {
         const changes = Array.from(this._changesBySynchronization);
         let previousElements = this._elementsSnapshot;

         if (this._elementsBySynchronization.size > 0) {
            previousElements = Array.from(
               this._elementsBySynchronization.values()
            )[this._elementsBySynchronization.size - 1];
         }

         for (const [currentId, operations] of changes) {
            const elements = applyOperations(previousElements, operations);
            this._elementsBySynchronization.set(currentId, elements);
            this._changesBySynchronization.delete(currentId);
            this._destroyedCountBySynchronization.set(
               synchronizationId,
               operations.reduce((acc, [type]) => {
                  return type === OperationType.DELETE ? acc + 1 : acc;
               }, 0)
            );

            if (currentId === synchronizationId) {
               result = elements;
               break;
            }

            previousElements = elements;
         }

         if (!result) {
            throw new Error(
               `Synchronization with id ${synchronizationId} didn't happen during this profiling session.`
            );
         }
      }

      return result;
   }

   private __onOperation(args: IOperationEvent['args']): void {
      if (this._isProfiling) {
         this._currentOperations.push(args);
      }
   }

   private __onEndSynchronization(id: string): void {
      if (this._isProfiling) {
         this._changesBySynchronization.set(id, this._currentOperations);
         this._currentOperations = [];
      }
   }

   private __toggleProfiling(): void {
      this._options.store.dispatch('toggleProfiling', !this._isProfiling);
   }

   private __onProfilingStatusChanged(status: boolean): void {
      if (this._isProfiling !== status) {
         this._isProfiling = status;
         if (status) {
            this._changesBySynchronization.clear();
            this._elementsBySynchronization.clear();
            this._snapshotBySynchronization.clear();
            this._currentOperations = [];
            this._synchronizations = undefined;
            this._snapshot = undefined;
            this._selectedCommitChanges = undefined;
            this._selectedCommitId = undefined;
            this._selectedSynchronizationId = '';
            this._elementsSnapshot = this._options.store.getElements().slice();
         } else {
            this._options.store.dispatch('getSynchronizationsList');
            this._options.store.dispatch('getProfilingData');
         }
      }
   }

   private __reloadAndProfile(): void {
      chrome.devtools.inspectedWindow.reload({
         injectedScript: 'this.__WASABY_START_PROFILING = true'
      });
   }

   private __onSearchValueChanged(e: Event, value: string): void {
      this.__updateSearch(value);
   }

   private __updateSearch(value: string): void {
      const searchResult = this._searchController.updateSearch(
         this._snapshot || [],
         value,
         this._selectedCommitId
      );

      if (typeof searchResult.id !== 'undefined') {
         this._selectedCommitId = searchResult.id;
         this.__updateSelectedCommitChanges();
      }
      this._lastFoundItemIndex = searchResult.index;
      this._searchTotal = searchResult.total;
   }

   private __onSearchKeydown(e: { nativeEvent: KeyboardEvent }): void {
      if (e.nativeEvent.key === 'Enter') {
         const searchResult = this._searchController.getNextItemId(
            this._searchValue,
            e.nativeEvent.shiftKey
         );

         if (typeof searchResult.id !== 'undefined') {
            this._selectedCommitId = searchResult.id;
            this.__updateSelectedCommitChanges();
         }
         this._lastFoundItemIndex = searchResult.index;
         this._searchTotal = searchResult.total;
      }
   }
}

export default Profiler;

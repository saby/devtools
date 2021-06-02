import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import { Memory } from 'Types/source';
import { RecordSet } from 'Types/collection';
import { Store } from 'Elements/elements';
import { IOperationEvent } from 'Extension/Plugins/Elements/IOperations';
import { ICommitDetailsOptions } from 'Profiler/_CommitDetails/CommitDetails';
import Flamegraph, { IFlamegraphControlNode } from '../_Flamegraph/Flamegraph';
import RankedView from '../_RankedView/RankedView';
import SynchronizationsList from '../_SynchronizationsList/SynchronizationsList';
import {
   applyOperations,
   convertProfilingData,
   getChanges,
   getChangesDescription,
   getSelfDuration,
   getSynchronizationOverview,
   stringifyProfilingData
} from '../_utils/Utils';
import { OperationType } from 'Extension/Plugins/Elements/const';
import Controller from '../../Search/Controller';
import {
   IBackendProfilingData,
   IFrontendProfilingData
} from 'Extension/Plugins/Elements/IProfilingData';
import { IFrontendControlNode } from 'Extension/Plugins/Elements/IControlNode';
import template = require('wml!Profiler/_Profiler/Profiler');
import { ControlUpdateReason } from 'Extension/Plugins/Elements/ControlUpdateReason';
import { WARNING_NAMES, WARNINGS, IWarning } from 'Profiler/_Warning/const';
import { Getter as FileSystem } from 'File/ResourceGetter/fileSystem';
import { Confirmation } from 'Controls/popup';
import 'css!Profiler/profiler';

interface IOptions extends IControlOptions {
   store: Store;
   selected: boolean;
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

/**
 * Controller of the profiler tab. Manages profiling status, combines information from the frontend and backend, controls current view, etc.
 * @author Зайцев А.С.
 */
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
      displayReasons: [
         'mounted',
         'selfUpdated',
         'parentUpdated',
         'forceUpdated'
      ]
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

   protected _searchController: Controller<'name'> = new Controller('name');

   protected _lastFoundItemIndex: number = 0;

   protected _searchTotal: number = 0;

   protected _logicParentName: string = '';
   protected _logicParentId: IFrontendControlNode['logicParentId'];
   protected _logicParentHovered: boolean = false;

   protected readonly _supportedFileExtensions: string[] = ['json'];

   private fileGetter?: FileSystem;

   private rankedViewItems?: RecordSet;

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
      this._rankedViewItemsReadyCallback = this._rankedViewItemsReadyCallback.bind(
         this
      );
   }

   protected _beforeUpdate(newOptions: IOptions): void {
      if (newOptions.selected && !this._options.selected) {
         const selectedIdFromStore = newOptions.store.getSelectedId();
         if (
            this._selectedCommitId !== selectedIdFromStore &&
            this._snapshot &&
            this._snapshot.find(({ id }) => id === selectedIdFromStore)
         ) {
            this.__setSelectedCommitId(selectedIdFromStore);
         }
      }
   }

   protected _rankedViewItemsReadyCallback(items: RecordSet): void {
      this.rankedViewItems = items;
   }

   private __setProfilingData(
      profilingData: IBackendProfilingData,
      fromImport: boolean = false
   ): void {
      this._didProfile = true;
      /**
       * Backend and frontend can have different lists of synchronizations because they start and end profiling at different times.
       * Because we need the data from both sources to create a profile we have to filter out non-matching ids.
       * But, there's one caveat: we shouldn't do this for imported profiles.
       */
      if (!fromImport) {
         profilingData.syncList = profilingData.syncList.filter(([id]) =>
            this._changesBySynchronization.has(id)
         );
         this._changesBySynchronization.forEach((_, key) => {
            if (!profilingData.syncList.find(([id]) => id === key)) {
               this._changesBySynchronization.delete(key);
            }
         });
      }

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
         this.__setSynchronization(profilingData.syncList[0][0]);
      }
   }

   private __setSynchronization(synchronizationKey: string): void {
      this._selectedSynchronizationId = synchronizationKey;
      const snapshot = this.getSnapshot(synchronizationKey);

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
         this._logicParentId = undefined;
         this._logicParentName = '';
      } else {
         const changes = getChangesDescription(
            this._profilingData,
            this._selectedSynchronizationId,
            this._selectedCommitId
         );

         const item = (this
            ._snapshot as Flamegraph['_options']['snapshot']).find(
            ({ id }) => id === this._selectedCommitId
         );

         if (
            item &&
            typeof item.logicParentId !== 'undefined' &&
            item.parentId !== item.logicParentId
         ) {
            this._logicParentId = item.logicParentId;
            this._logicParentName = ((this
               ._snapshot as Flamegraph['_options']['snapshot']).find(
               (elem) => elem.id === this._logicParentId
            ) as IFrontendControlNode).name;
         } else {
            this._logicParentId = undefined;
            this._logicParentName = '';
         }

         if (changes) {
            this._selectedCommitChanges = {
               updateReason: changes.updateReason,
               changedOptions: changes.changedOptions,
               changedAttributes: changes.changedAttributes,
               changedReactiveProps: changes.changedReactiveProps,
               warnings: this.__getWarnings(item)
            };
         } else {
            this._selectedCommitChanges = {
               updateReason: 'unchanged'
            };
         }
      }
   }

   /**
    * Takes warnings of the item and if they exist transforms them into array of objects.
    * @returns Array of IWarning objects or undefined if there are no warnings for the commit.
    */
   private __getWarnings(
      item?: IFlamegraphControlNode
   ): IWarning[] | undefined {
      let warnings;
      if (item && item.warnings) {
         warnings = item.warnings
            .map((name) => WARNINGS[name])
            // filter out nonexistent warnings to support importing profiles from different versions
            .filter((warning) => warning);
      }
      return warnings;
   }

   protected _masterMarkedKeyChanged(
      e: Event,
      id: Profiler['_selectedSynchronizationId']
   ): void {
      if (
         (this
            ._synchronizations as SynchronizationsList['_options']['synchronizations']).find(
            (item) => item.id === id
         )
      ) {
         this.__setSynchronization(id);
      }
   }

   protected _detailMarkedKeyChanged(
      e: Event,
      id?: IFrontendControlNode['id']
   ): void {
      this.__setSelectedCommitId(id);
   }

   private __setSelectedCommitId(id?: IFrontendControlNode['id']): void {
      this._selectedCommitId = id;
      this._options.store.setSelectedId(id);
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

   protected _toggleProfiling(): void {
      this._options.store.dispatch('toggleProfiling', !this._isProfiling);
   }

   private __onProfilingStatusChanged(status: boolean): void {
      if (this._isProfiling !== status) {
         this._isProfiling = status;
         if (status) {
            this.resetState();
         } else {
            this._options.store.dispatch('getProfilingData');
         }
      }
   }

   protected _reloadAndProfile(): void {
      chrome.devtools.inspectedWindow.reload({
         injectedScript: 'this.__WASABY_START_PROFILING = true'
      });
   }

   protected _onSearchValueChanged(e: Event, value: string): void {
      this.__updateSearch(value);
   }

   private __updateSearch(value: string): void {
      let items = [];
      if (this._selectedTab === 'Flamegraph' && this._snapshot) {
         items = this._snapshot;
      } else if (this._selectedTab === 'Ranked' && this.rankedViewItems) {
         items = this.rankedViewItems.getRawData();
      }
      const searchResult = this._searchController.updateSearch(
         items,
         value,
         this._selectedCommitId
      );

      if (typeof searchResult.id !== 'undefined') {
         this.__setSelectedCommitId(searchResult.id);
      }
      this._lastFoundItemIndex = searchResult.index;
      this._searchTotal = searchResult.total;
   }

   protected _onSearchKeydown(e: { nativeEvent: KeyboardEvent }): void {
      if (e.nativeEvent.key === 'Enter') {
         const searchResult = this._searchController.getNextItemId(
            this._searchValue,
            e.nativeEvent.shiftKey
         );

         if (typeof searchResult.id !== 'undefined') {
            this.__setSelectedCommitId(searchResult.id);
         }
         this._lastFoundItemIndex = searchResult.index;
         this._searchTotal = searchResult.total;
      }
   }

   /**
    * Stringifies the profiling data and saves it to JSON.
    * Only 3 things are saved: changes descriptions, destroyed count and synchronization snapshots.
    * If snapshots for some synchronizations do not exist at the moment of exporting, they'll be generated here.
    */
   protected _exportToJSON(): void {
      function download(
         content: string,
         fileName: string,
         fileType: string
      ): void {
         const a = document.createElement('a');
         const file = new Blob([content], { type: fileType });
         a.href = URL.createObjectURL(file);
         a.download = fileName;
         a.click();
      }

      // this will generate snapshot for every synchronization
      (this
         ._synchronizations as SynchronizationsList['_options']['synchronizations']).forEach(
         ({ id }) => {
            this.getSnapshot(id);
         }
      );

      const MS_LENGTH = 3;
      const date = new Date()
         .toISOString()
         .replace(/[-Z:.]/g, '')
         .slice(0, -MS_LENGTH);

      download(
         stringifyProfilingData(
            this._profilingData.synchronizationKeyToDescription,
            this._snapshotBySynchronization,
            this._destroyedCountBySynchronization
         ),
         `WasabyProfile-${date}.json`,
         'application/json'
      );
   }

   /**
    * Opens native file chooser then imports profile from the selected file.
    */
   protected async _importFromJSON(): Promise<void> {
      const files = await this.getFileGetter().getFiles();
      return this.importFromFile(files);
   }

   /**
    * Imports profile from the dropped file.
    */
   protected async _onFileDrop(
      e: Event,
      results: Array<{
         message?: string;
         getData: () => Blob;
      }>
   ): Promise<void> {
      return this.importFromFile(results);
   }

   protected _logicParentHoverChanged(e: Event, state: boolean): void {
      this._logicParentHovered = state;
   }

   /**
    * Handles importing of the files: parses, validates, applies, etc.
    */
   private async importFromFile(
      files?: Array<{
         message?: string;
         getData: () => Blob;
      }>
   ): Promise<void> {
      if (files) {
         if (files[0].message) {
            Profiler.openErrorPopup('Incorrect profile format.');
            return;
         }
         const text = await new Response(files[0].getData()).text();

         let parsedData: {
            snapshotBySynchronization?: Profiler['_snapshotBySynchronization'];
            destroyedCountBySynchronization?: Profiler['_destroyedCountBySynchronization'];
            syncList?: IBackendProfilingData['syncList'];
         };

         try {
            parsedData = JSON.parse(text);

            if (
               !parsedData.syncList ||
               !parsedData.snapshotBySynchronization ||
               !parsedData.destroyedCountBySynchronization
            ) {
               Profiler.openErrorPopup('Incorrect profile format.');
               return;
            }
         } catch {
            Profiler.openErrorPopup('Incorrect profile format.');
            return;
         }

         this.resetState();

         this._snapshotBySynchronization = new Map(
            parsedData.snapshotBySynchronization
         );
         this._destroyedCountBySynchronization = new Map(
            parsedData.destroyedCountBySynchronization
         );
         this.__setProfilingData(
            {
               initialIdToDuration: [],
               syncList: parsedData.syncList
            },
            true
         );
      }
   }
   /**
    * Returns a getter for getting files from the file system through native dialog.
    */
   private getFileGetter(): FileSystem {
      if (!this.fileGetter) {
         this.fileGetter = new FileSystem({
            multiSelect: false,
            extensions: this._supportedFileExtensions
         });
      }
      return this.fileGetter;
   }

   /**
    * Resets state before the start of a new profiling session.
    */
   private resetState(): void {
      this._changesBySynchronization.clear();
      this._elementsBySynchronization.clear();
      this._snapshotBySynchronization.clear();
      this._destroyedCountBySynchronization.clear();
      this._profilingData = {
         synchronizationKeyToDescription: new Map(),
         initialIdToDuration: new Map()
      };
      this._currentOperations = [];
      this._synchronizations = undefined;
      this._snapshot = undefined;
      this._selectedCommitChanges = undefined;
      // We should reset id in the store only if it's the same.
      // Otherwise, we can lose the state in the Elements tab.
      if (this._options.store.getSelectedId() === this._selectedCommitId) {
         this._options.store.setSelectedId();
      }
      this._selectedCommitId = undefined;
      this._selectedSynchronizationId = '';
      this._elementsSnapshot = this._options.store.getElements().slice();
   }

   /**
    * Returns snapshot of the synchronization. Generates and caches it if it didn't exist.
    */
   private getSnapshot(
      synchronizationKey: string
   ): Flamegraph['_options']['snapshot'] {
      let snapshot = this._snapshotBySynchronization.get(synchronizationKey);

      if (!snapshot) {
         /*
         We have two sources of information:
         1) Profiling data (timings, update reason, dom changes, etc) which is only collected during profiling.
         2) Operations on the elements tree which are always collected.
         Here we're merging the information from both to get the snapshot which will be used to render graphs.
         Because timings and dom changes should propagate, we're traversing in reverse order - from children to parents.
          */
         snapshot = [];
         const changes = getChanges(this._profilingData, synchronizationKey);
         const elements = this.__getElementsBySynchronization(
            synchronizationKey
         );

         const parentsOfElementsWithDOMChanges: Set<
            IFrontendControlNode['id']
         > = new Set();
         const parentsOfSynchronizedElements: Set<
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
            const elementChanges = changes.get(currentItem.id);
            const selfDuration = getSelfDuration(
               this._profilingData,
               synchronizationKey,
               currentItem.id
            );
            const lifecycleDuration = elementChanges
               ? elementChanges.lifecycleDuration
               : 0;
            const warnings: WARNING_NAMES[] = [];
            const updateReason: ControlUpdateReason = elementChanges
               ? elementChanges.updateReason
               : 'unchanged';
            const hasChangesInSubtree =
               updateReason !== 'unchanged' ||
               parentsOfSynchronizedElements.has(currentItem.id);

            if (
               parentsOfElementsWithDOMChanges.has(currentItem.id) ||
               (elementChanges && elementChanges.domChanged)
            ) {
               if (typeof currentItem.parentId !== 'undefined') {
                  parentsOfElementsWithDOMChanges.add(currentItem.parentId);
               }
            } else if (updateReason !== 'unchanged') {
               warnings.push('domUnchanged');
            }

            let actualBaseDuration = selfDuration;
            let actualDuration =
               updateReason === 'unchanged' ? 0 : selfDuration;
            const duration = parentsDuration.get(currentItem.id);
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

               if (hasChangesInSubtree) {
                  parentsOfSynchronizedElements.add(currentItem.parentId);
               }
            }

            if (elementChanges) {
               if (!elementChanges.isVisible) {
                  warnings.push('invisible');
               }
               if (elementChanges.unusedReceivedState) {
                  warnings.push('unusedReceivedState');
               }
               if (elementChanges.asyncControl) {
                  warnings.push('asyncControl');
               }
               if (
                  updateReason === 'forceUpdated' &&
                  !elementChanges.changedReactiveProps
               ) {
                  warnings.push('manualForceUpdate');
               }
            }

            snapshot.push({
               ...currentItem,
               selfDuration,
               updateReason,
               warnings: warnings.length ? warnings : undefined,
               actualBaseDuration,
               actualDuration,
               lifecycleDuration,
               hasChangesInSubtree
            });
         }

         this._snapshotBySynchronization.set(
            synchronizationKey,
            snapshot.reverse()
         );
      }

      return snapshot;
   }

   /**
    * Opens popup with the passed error text.
    * @param errorText
    */
   private static openErrorPopup(
      errorText: string
   ): Promise<boolean | undefined> {
      return Confirmation.openPopup({
         type: 'ok',
         style: 'danger',
         details: errorText
      });
   }
}

export default Profiler;

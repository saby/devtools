import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import { Memory } from 'Types/source';
import { adapter } from 'Types/entity';
import {
   IBackendProfilingData,
   IChangesDescription,
   IControlNode
} from 'Extension/Plugins/Elements/IControlNode';
import Store from 'Elements/Store';
import { IOperationEvent } from 'Extension/Plugins/Elements/IOperations';
import CommitDetails from 'Profiler/CommitDetails';
import 'css!Profiler/Profiler';
import Flamegraph from './Flamegraph/Flamegraph';
import RankedView from './RankedView/RankedView';
import SynchronizationsList from './SynchronizationsList/SynchronizationsList';
import {
   applyOperations,
   convertProfilingData,
   getActualDuration,
   getChanges,
   getChangesDescription,
   getSelfDuration
} from './Utils';
// @ts-ignore
import template = require('wml!Profiler/Profiler');
import Tab = chrome.tabs.Tab;

interface IOptions extends IControlOptions {
   store: Store;
}

export interface IFrontendSynchronizationDescription {
   selfDuration: number;
   changes: Map<IControlNode['id'], IChangesDescription>;
}

export interface IProfilingData {
   initialIdToDuration: Map<IControlNode['id'], number>;
   synchronizationKeyToDescription: Map<
      string,
      IFrontendSynchronizationDescription
   >;
}

function masterFilter(item: adapter.IRecord): boolean {
   const duration: number = item.get('selfDuration');
   return duration !== 0;
}

function detailFilter(item: adapter.IRecord): boolean {
   const duration: number = item.get('selfDuration');
   const didRender: boolean = item.get('didRender');
   return duration !== 0 && didRender;
}

class Profiler extends Control<IOptions> {
   protected _template: TemplateFunction = template;

   protected _isProfiling: boolean = false;

   protected _profilingData: IProfilingData;

   protected _changesBySynchronization: Map<
      string,
      Profiler['_currentOperations']
   > = new Map();

   protected _elementsBySynchronization: Map<
      string,
      Store['_elements']
   > = new Map();

   protected _snapshotBySynchronization: Map<
      string,
      Flamegraph['_options']['snapshot']
   > = new Map();

   protected _screenshotBySynchronization: Map<string, string> = new Map();

   protected _elementsSnapshot: Store['_elements'] = [];

   protected _snapshot?: Flamegraph['_options']['snapshot'];

   protected _synchronizations?: SynchronizationsList['_options']['synchronizations'];

   protected _masterFilter: SynchronizationsList['_options']['filter'] = masterFilter;

   protected _detailFilter: RankedView['_options']['filter'] = detailFilter;

   protected _currentOperations: Array<IOperationEvent['args']>;

   protected _radioGroupSource: Memory = new Memory({
      idProperty: 'title',
      data: [
         {
            title: 'Flamegraph'
         },
         {
            title: 'Ranked'
         }
      ]
   });

   // TODO: запоминать выбранную вкладку в хромовском хранилище
   protected _selectedTab: string = 'Flamegraph';

   protected _selectedSynchronizationId: string = '';

   protected _selectedCommitId: string = '';

   protected _selectedCommitChanges: CommitDetails['_options']['changesDescription'];

   protected _saveScreenshots: boolean = false;

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
      options.store.dispatch('getProfilingStatus');
   }

   protected _beforeMount(): Promise<void> {
      return new Promise((resolve) => {
         chrome.storage.sync.get(['saveScreenshots'], (result) => {
            this._saveScreenshots = !!result.saveScreenshots;
            resolve();
         });
      });
   }

   private __setProfilingData(profilingData: IBackendProfilingData): void {
      this._profilingData = convertProfilingData(profilingData);
      this._synchronizations = profilingData.syncList.map(
         ([id, { selfDuration }]) => {
            return {
               id,
               selfDuration
            };
         }
      );
      this._selectedSynchronizationId = profilingData.syncList[0][0];

      this.__setSynchronization(this._selectedSynchronizationId);
   }

   private __setSynchronization(synchronizationKey: IControlNode['id']): void {
      let snapshot = this._snapshotBySynchronization.get(synchronizationKey);
      if (!snapshot) {
         /**
          * TODO: адская жесть с несколькими обходами массива и кучей мержей объектов
          * Особенно при подсчёте actualDurations. По идее нужно слить в одну функцию и
          * actualDuration высчитывать вообще по-другому
          */
         const changes = getChanges(this._profilingData, synchronizationKey);
         const elements = this.__getElementsBySynchronization(
            synchronizationKey
         );

         const dataWithSelfDurations = elements.map((element) => {
            return {
               ...element,
               didRender: changes.has(element.id),
               selfDuration: getSelfDuration(
                  this._profilingData,
                  synchronizationKey,
                  element.id
               )
            };
         });

         snapshot = dataWithSelfDurations.map((element, index) => {
            return {
               ...element,
               actualDuration: getActualDuration(
                  dataWithSelfDurations,
                  element.id,
                  index
               )
            };
         });

         this._snapshotBySynchronization.set(synchronizationKey, snapshot);
      }

      this._snapshot = snapshot;
      this.__updateSelectedCommitChanges();
   }

   private __updateSelectedCommitChanges(): void {
      const changes = getChangesDescription(
         this._profilingData,
         this._selectedSynchronizationId,
         this._selectedCommitId
      );

      if (changes) {
         this._selectedCommitChanges = {
            isFirstRender: changes.isFirstRender,
            changedOptions: changes.changedOptions,
            changedAttributes: changes.changedAttributes,
            screenshotURL: this._screenshotBySynchronization.get(
               this._selectedSynchronizationId
            )
         };
      } else {
         this._selectedCommitChanges = undefined;
      }
   }

   private __masterMarkedKeyChanged(e: Event, id: string): void {
      this._selectedSynchronizationId = id;
      this.__setSynchronization(this._selectedSynchronizationId);
   }

   private __detailMarkedKeyChanged(e: Event, id: string): void {
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

         for (const [currentId, operations] of changes) {
            let elements = this._elementsBySynchronization.get(currentId);

            if (!elements) {
               elements = applyOperations(previousElements, operations);
               this._elementsBySynchronization.set(currentId, elements);

               // TODO: хотелось бы эту строку вернуть, но тогда я теряю все посчитанные
               //  синхронизации и вычисляю неправильные деревья
               // нужно for с 0 до changes.length+elementsBySynchronization.length
               // this._changesBySynchronization.delete(currentId);
            }

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

         if (this._saveScreenshots) {
            /**
             * captureVisibleTab defaults windowId to currentWindow.
             * Unfortunately, currentWindow inside undocked devtools is the devtools window itself.
             * To work around this, we find the inspected tab and get windowId from it.
             */
            chrome.tabs.query({}, (tabs) => {
               const inspectedTab = tabs.find((tab) => {
                  return tab.id === chrome.devtools.inspectedWindow.tabId;
               }) as Tab;
               chrome.tabs.captureVisibleTab(
                  inspectedTab.windowId,
                  (dataUrl) => {
                     this._screenshotBySynchronization.set(id, dataUrl);
                  }
               );
            });
         }
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
            this._screenshotBySynchronization.clear();
            this._snapshotBySynchronization.clear();
            this._currentOperations = [];
            this._synchronizations = undefined;
            this._snapshot = undefined;
            this._selectedCommitChanges = undefined;
            this._selectedCommitId = '';
            this._selectedSynchronizationId = '';
            this._elementsSnapshot = this._options.store.getElements().slice();
         } else {
            this._options.store.dispatch('getSynchronizationsList');
            this._options.store.dispatch('getProfilingData');
         }
      }
   }

   private __toggleSaveScreenshots(e: Event, saveScreenshots: boolean): void {
      chrome.storage.sync.set({
         saveScreenshots
      });
   }

   private __reloadAndProfile(): void {
      chrome.devtools.inspectedWindow.reload({
         injectedScript: 'this.__WASABY_START_PROFILING = true'
      });
   }
}

export default Profiler;

import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
// @ts-ignore
import template = require('wml!Profiler/Profiler');
// @ts-ignore
import commitTimeTemplate = require('wml!Profiler/commitTimeTemplate');
// @ts-ignore
import synchronizationTemplate = require('wml!Profiler/synchronizationTemplate');
import { Memory } from 'Types/source';
import { Model } from 'Types/entity';
import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';
import Store from 'Elements/Store';
import { IOperationEvent } from 'Extension/Plugins/Elements/IOperations';
import { OperationType } from 'Extension/Plugins/Elements/const';
import CommitDetails from 'Profiler/CommitDetails';
import 'css!Profiler/Profiler';
import Tab = chrome.tabs.Tab;

interface ISynchronization {
   id: string;
   changes: Array<{
      id: IControlNode['id'];
      operation: OperationType;
      selfDuration: number;
   }>;
   selfDuration: number;
}

interface IOptions extends IControlOptions {
   store: Store;
}

function applyOperations(
   initialElements: Store['_elements'],
   operations: Profiler['_currentOperations']
): Store['_elements'] {
   const result = initialElements.slice();

   operations.forEach(([type, id, ...args]) => {
      switch (type) {
         case OperationType.CREATE:
            result.push({
               id,
               name: args[0] as string,
               parentId: args.length === 5 ? args[2] : undefined
            });
            break;
         case OperationType.DELETE:
            const index = result.findIndex((element) => element.id === id);
            if (index !== -1) {
               result.splice(index, 1);
            }
            break;
         case OperationType.REORDER:
            break;
         case OperationType.UPDATE:
            break;
      }
   });

   return result;
}

class Profiler extends Control<IOptions> {
   protected _template: TemplateFunction = template;

   protected _synchronizationTemplate: TemplateFunction = synchronizationTemplate;

   protected _isProfiling: boolean = false;

   protected _changesBySynchronization: Map<
      ISynchronization['id'],
      Profiler['_currentOperations']
   > = new Map();

   protected _elementsBySynchronization: Map<
      ISynchronization['id'],
      Store['_elements']
   > = new Map();

   protected _screenshotsBySynchronization: Map<
      ISynchronization['id'],
      string
   > = new Map();

   protected _elementsSnapshot: Store['_elements'] = [];

   protected _currentOperations: Array<IOperationEvent['args']>;

   protected _masterSource?: Memory;

   protected _detailSource?: Memory;

   protected _selectedSynchronizationId: string = '';

   protected _selectedCommitId: string = '';

   protected _selectedCommitChanges: CommitDetails['_options']['changesDescription'];

   protected _saveScreenshots: boolean = false;

   protected _detailColumns: object[] = [
      {
         displayProperty: 'name'
      },
      {
         template: commitTimeTemplate
      }
   ];

   protected _detailsSorting: object[] = [
      {
         selfDuration: 'desc'
      }
   ];

   constructor(options: IOptions) {
      super(options);
      options.store.addListener(
         'synchronizationsList',
         this.__setSyncList.bind(this)
      );
      options.store.addListener(
         'synchronization',
         this.__setSynchronization.bind(this)
      );
      options.store.addListener('operation', this.__onOperation.bind(this));
      options.store.addListener(
         'endSynchronization',
         this.__onEndSynchronization.bind(this)
      );
      options.store.addListener(
         'profilingStatusChanged',
         this.__onProfilingStatusChanged.bind(this)
      );
      options.store.addListener(
         'controlChanges',
         this.__setControlChangesOnSynchronization.bind(this)
      );
   }

   private __setSyncList(
      syncList: Array<{
         id: ISynchronization['id'];
         selfDuration: ISynchronization['selfDuration'];
      }>
   ): void {
      this._masterSource = new Memory({
         idProperty: 'id',
         data: syncList.map(({ id, selfDuration }) => {
            return {
               id,
               selfDuration
            };
         })
      });
      this._selectedSynchronizationId = syncList[0].id;
      this._options.store.dispatch(
         'getSynchronization',
         this._selectedSynchronizationId
      );
   }

   private __setSynchronization({ id, changes }: ISynchronization): void {
      if (id === this._selectedSynchronizationId) {
         const elements = this.__getElementsBySynchronization(
            this._selectedSynchronizationId
         );
         // TODO: тут ненужные пересчёты частенько, да и вообще медленно написано
         const data = elements.map((element) => {
            const changedElement = changes.find((elem) => {
               return elem.id === element.id;
            });
            let selfDuration = 0;
            if (changedElement) {
               selfDuration = changedElement.selfDuration;
            }
            return {
               ...element,
               selfDuration
            };
         });
         const changedData = data.filter((element) => {
            // TODO: для ranked view актуальна только эта информация, но для flamegraph это нужно будет поправить. Но там скорее всего вообще не будет сорса
            return element.selfDuration;
         });
         this._detailSource = new Memory({
            idProperty: 'id',
            data: changedData
         });

         /**
          * TODO: костылище, нужно обсудить с Лёхой нормально
          * Меняющиеся сорсы и маркеры несовместимы, потому что списки сами себе проставляют markedKey,
          * а не работают по опциям. Тут 2 проблемы вылезают:
          * 1) Нельзя синхронно менять ключ и сорс, с точки зрения списка выбранный элемент должен быть загружен.
          * 2) Из-за этого нет смысла подписываться на markedKeyChanged, иначе затирается правильный ключ.
          *
          * По-хорошему, нужно по возможности сохранять выбранную запись при смене синхронизации.
          * Если она удалена, то выбирать первую, причем с учетом сортировки и фильтрации.
          */
         if (changedData.length) {
            this._selectedCommitId = changedData.slice().sort((first, second) => {
               return second.selfDuration - first.selfDuration;
            })[0].id;
            this._options.store.dispatch('getControlChangesOnSynchronization', {
               synchronizationId: this._selectedSynchronizationId,
               commitId: this._selectedCommitId
            });
         } else {
            this._selectedCommitId = '';
         }
      }
   }

   private __masterMarkedKeyChanged(e: Event, item: Model): void {
      this._selectedSynchronizationId = item.getId();
      this._options.store.dispatch(
         'getSynchronization',
         this._selectedSynchronizationId
      );
   }

   private __detailsMarkedKeyChanged(e: Event, item: Model): void {
      this._selectedCommitId = item.getId();
      this._options.store.dispatch('getControlChangesOnSynchronization', {
         synchronizationId: this._selectedSynchronizationId,
         commitId: this._selectedCommitId
      });
   }

   private __setControlChangesOnSynchronization(changes?: {
      synchronizationId: string;
      commitId: string;
      isFirstRender: boolean;
      changedOptions?: string;
      changedAttributes?: string;
   }): void {
      if (
         changes &&
         this._selectedSynchronizationId === changes.synchronizationId &&
         this._selectedCommitId === changes.commitId
      ) {
         this._selectedCommitChanges = {
            isFirstRender: changes.isFirstRender,
            changedOptions: changes.changedOptions,
            changedAttributes: changes.changedAttributes,
            screenshotURL: this._screenshotsBySynchronization.get(
               changes.synchronizationId
            )
         };
      } else {
         this._selectedCommitChanges = undefined;
      }
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

               // TODO: хотелось бы эту строку вернуть, но тогда я теряю все посчитанные синхронизации и вычисляю неправильные деревья
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

   private __onEndSynchronization(id: ISynchronization['id']): void {
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
                     this._screenshotsBySynchronization.set(id, dataUrl);
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
            this._screenshotsBySynchronization.clear();
            this._currentOperations = [];
            this._masterSource = undefined;
            this._detailSource = undefined;
            this._selectedCommitChanges = undefined;
            this._selectedCommitId = '';
            this._selectedSynchronizationId = '';
            this._elementsSnapshot = this._options.store.getElements().slice();
         } else {
            this._options.store.dispatch('getSynchronizationsList');
         }
      }
   }
}

export default Profiler;

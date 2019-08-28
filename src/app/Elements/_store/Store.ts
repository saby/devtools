import { ContentChannel } from '../../Devtool/Event/ContentChannel';
import {
   IBackendControlNode,
   IFrontendControlNode
} from 'Extension/Plugins/Elements/IControlNode';
import { IOperationEvent } from 'Extension/Plugins/Elements/IOperations';
import { ControlType, OperationType } from 'Extension/Plugins/Elements/const';
import { IHandler, ISerializable } from 'Extension/Event/IEventEmitter';

export function applyOperation(
   elements: Store['_elements'],
   args: IOperationEvent['args']
): void {
   switch (args[0]) {
      case OperationType.CREATE:
         addNode(elements, args[1], args[2], args[3], args[4]);
         break;
      case OperationType.DELETE:
         removeNode(elements, args[1]);
         break;
      case OperationType.REORDER:
         break;
      case OperationType.UPDATE:
         break;
   }
}

class Store {
   protected _channel: ContentChannel = new ContentChannel('elements');
   protected _elements: IFrontendControlNode[] = [];
   protected _devtoolsOpened: boolean = false;
   protected _hasFullTree: boolean = false;
   protected _getElementsPromise?: Promise<Store['_elements']>;

   constructor() {
      this._channel.addListener(
         'operation',
         this.__operationHandler.bind(this)
      );
      this._channel.addListener('endOfTree', () => {
         this._hasFullTree = true;
      });
      this._channel.addListener(
         'endSynchronization',
         this.__onEndSynchronization.bind(this)
      );
   }

   dispatch(eventName: string, args?: ISerializable): void {
      this._channel.dispatch(eventName, args);
   }

   addListener<T>(eventName: string, handler: IHandler<T>): void {
      this._channel.addListener(eventName, handler);
   }

   destructor(): void {
      this._channel.destructor();
      this._elements = [];
   }

   getElements(): Store['_elements'] {
      return this._elements;
   }

   getFullTree(): Promise<Store['_elements']> {
      if (this._getElementsPromise) {
         return this._getElementsPromise;
      }
      if (!this._hasFullTree) {
         this._getElementsPromise = new Promise((resolve) => {
            const waitForFullTree = () => {
               this._channel.removeListener('endOfTree', waitForFullTree);
               resolve(this.getElements());
            };
            this._channel.addListener('endOfTree', waitForFullTree);
         });
         return this._getElementsPromise;
      }
      return Promise.resolve(this.getElements());
   }

   toggleDevtoolsOpened(state: boolean): void {
      if (state !== this._devtoolsOpened) {
         this._devtoolsOpened = state;
         this._channel.dispatch('devtoolsInitialized');
      }
   }

   private __onEndSynchronization(): void {
      const uniqueIds: Set<IFrontendControlNode['id']> = new Set();
      this._elements = this._elements.filter((element) => {
         if (uniqueIds.has(element.id)) {
            return false;
         }
         uniqueIds.add(element.id);
         return true;
      });
   }

   private __operationHandler(args: IOperationEvent['args']): void {
      applyOperation(this._elements, args);
   }
}

function removeNode(
   elements: Store['_elements'],
   id: IBackendControlNode['parentId']
): void {
   const index = elements.findIndex((element) => element.id === id);
   if (index !== -1) {
      elements.splice(index, 1);
   }
}

function addNode(
   elements: Store['_elements'],
   id: IBackendControlNode['id'],
   name: IBackendControlNode['name'],
   controlType: ControlType,
   parentId?: IBackendControlNode['parentId']
): void {
   if (typeof parentId === 'undefined') {
      elements.push({
         id,
         name,
         parentId,
         class: getClassByControlType(controlType),
         depth: 0
      });
   } else {
      // TODO: сделать добавление в произвольное место
      const parentIndex = elements.findIndex(
         (element) => element.id === parentId
      );
      let lastChildIndex = parentIndex + 1;
      if (parentIndex === -1) {
         throw new Error(`Can't find the parent. Element id: ${id}, parentId: ${parentId}`);
      } else {
         while (
            elements[lastChildIndex] &&
            elements[lastChildIndex].depth > elements[parentIndex].depth
            ) {
            lastChildIndex++;
         }
      }
      elements.splice(lastChildIndex, 0, {
         id,
         name,
         parentId,
         class: getClassByControlType(controlType),
         depth: getDepth(elements, parentId)
      });
   }
}

function getClassByControlType(controlType: ControlType): string {
   switch (controlType) {
      case ControlType.HOC:
         return 'Elements__node_hoc';
      case ControlType.CONTROL:
         return 'Elements__node_control';
      case ControlType.TEMPLATE:
         return 'Elements__node_template';
   }
}

function getDepth(
   elements: Store['_elements'],
   parentId?: IBackendControlNode['parentId']
): number {
   if (typeof parentId !== 'undefined') {
      const parent = elements.find((element) => element.id === parentId);
      if (parent) {
         return parent.depth + 1;
      }
   }
   return 0;
}

export default Store;

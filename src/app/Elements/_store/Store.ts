import { ContentChannel } from '../../Devtool/Event/ContentChannel';
import {
   IBackendControlNode,
   IFrontendControlNode
} from 'Extension/Plugins/Elements/IControlNode';
import { IOperationEvent } from 'Extension/Plugins/Elements/IOperations';
import { ControlType, OperationType } from 'Extension/Plugins/Elements/const';
import { IHandler, ISerializable } from 'Extension/Event/IEventEmitter';

const NAME_INDEX = 2;
const CONTROL_TYPE_INDEX = 3;
const PARENT_ID_INDEX = 4;
const LOGIC_PARENT_ID_INDEX = 5;
const REORDER_ARGS_OFFSET = 2;
const POLLING_INTERVAL = 1000;

export function applyOperation(
   elements: Store['_elements'],
   args: IOperationEvent['args']
): void {
   switch (args[0]) {
      case OperationType.CREATE:
         addNode(
            elements,
            args[1],
            args[NAME_INDEX],
            args[CONTROL_TYPE_INDEX],
            args[PARENT_ID_INDEX],
            args[LOGIC_PARENT_ID_INDEX]
         );
         break;
      case OperationType.DELETE:
         removeNode(elements, args[1]);
         break;
      case OperationType.REORDER:
         reorderChildren(elements, args[1], args.slice(REORDER_ARGS_OFFSET));
         break;
      case OperationType.UPDATE:
         break;
   }
}

/**
 * Collects and stores information about VDOM-tree from the frontend.
 * @author Зайцев А.С.
 */
class Store {
   protected _channel: ContentChannel = new ContentChannel('elements');
   protected _elements: IFrontendControlNode[] = [];
   protected _devtoolsOpened: boolean = false;
   protected _hasFullTree: boolean = false;
   protected _getElementsPromise?: Promise<Store['_elements']>;
   protected _selectedId?: IFrontendControlNode['id'];

   constructor() {
      this._channel.addListener(
         'operation',
         (args: IOperationEvent['args']) => {
            applyOperation(this._elements, args);
         }
      );
      this._channel.addListener('endOfTree', () => {
         this._hasFullTree = true;
      });
   }

   dispatch(eventName: string, args?: ISerializable): void {
      this._channel.dispatch(eventName, args);
   }

   addListener<T>(eventName: string, handler: IHandler<T>): void {
      this._channel.addListener(eventName, handler);
   }

   removeListener<T>(eventName: string, handler: IHandler<T>): void {
      this._channel.removeListener(eventName, handler);
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

         /**
          * Store gets recreated when a user navigates to another page.
          * Due to lazy initialization, Store can ask for items before the Agent was initialized.
          * So, we should poll devtools until the first operation comes in, to ensure that the Agent has received the message.
          */
         let pollingInterval: number | undefined;
         const operationListener = () => {
            this._channel.removeListener('operation', operationListener);
            if (pollingInterval) {
               window.clearInterval(pollingInterval);
            }
         };

         this._channel.addListener('operation', operationListener);

         pollingInterval = window.setInterval(() => {
            this._channel.dispatch('devtoolsInitialized');
         }, POLLING_INTERVAL);
      }
   }

   setSelectedId(id?: IFrontendControlNode['id']): void {
      this._selectedId = id;
   }

   getSelectedId(): IFrontendControlNode['id'] | undefined {
      return this._selectedId;
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
   parentId?: IBackendControlNode['parentId'],
   logicParentId?: IBackendControlNode['logicParentId']
): void {
   if (typeof parentId === 'undefined') {
      elements.push({
         id,
         name,
         parentId,
         logicParentId,
         class: getClassByControlType(controlType),
         depth: 0
      });
   } else {
      const parentIndex = elements.findIndex(
         (element) => element.id === parentId
      );
      let lastChildIndex = parentIndex + 1;
      if (parentIndex === -1) {
         throw new Error(
            `Can't find the parent. Element id: ${id}, parentId: ${parentId}, logicParentId: ${logicParentId}, name: ${name}`
         );
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
         logicParentId,
         class: getClassByControlType(controlType),
         depth: elements[parentIndex].depth + 1
      });
   }
}

function reorderChildren(
   elements: Store['_elements'],
   parentId: IBackendControlNode['id'],
   newOrder: Array<IBackendControlNode['id']>
): void {
   const childrenIds = elements
      .filter((child) => child.parentId === parentId)
      .map(({ id }) => id);
   const movedChildrenIds = getMovedChildrenIds(childrenIds, newOrder);

   const firstMovedChildId = childrenIds.find((id) =>
      movedChildrenIds.includes(id)
   );
   const firstMovedChildIndex = elements.findIndex(
      ({ id }) => id === firstMovedChildId
   );

   const newChildren: Store['_elements'] = [];
   movedChildrenIds.forEach((childId) => {
      newChildren.push(...sliceSubtree(elements, childId));
   });

   elements.splice(firstMovedChildIndex, newChildren.length, ...newChildren);
}

function getMovedChildrenIds(
   childrenIds: Array<IBackendControlNode['id']>,
   newOrder: Array<IBackendControlNode['id']>
): Array<IBackendControlNode['id']> {
   // Skip items at the beginning that didn't change position
   let startIndex = 0;
   for (let i = 0; i < newOrder.length; i++) {
      startIndex = i;
      if (childrenIds[i] !== newOrder[i]) {
         break;
      }
   }
   // Skip items at the end that didn't change position
   let endIndex = newOrder.length;
   for (let i = newOrder.length - 1; i >= 0 && i >= startIndex; i--) {
      endIndex = i;
      if (childrenIds[i] !== newOrder[i]) {
         break;
      }
   }
   return newOrder.slice(startIndex, endIndex + 1);
}

function sliceSubtree(
   elements: Store['_elements'],
   rootId: IBackendControlNode['id']
): Store['_elements'] {
   const startIndex = elements.findIndex(({ id }) => id === rootId);
   const depth = elements[startIndex].depth;
   let endIndex = elements.length;
   for (let i = startIndex + 1; i < elements.length; i++) {
      if (elements[i].depth <= depth) {
         endIndex = i;
         break;
      }
   }
   return elements.slice(startIndex, endIndex);
}

function getClassByControlType(controlType: ControlType): string {
   switch (controlType) {
      case ControlType.HOC:
         return 'devtools-Elements__node_hoc';
      case ControlType.CONTROL:
         return 'devtools-Elements__node_control';
      case ControlType.TEMPLATE:
         return 'devtools-Elements__node_template';
   }
}

export default Store;

import { ContentChannel } from '../Devtool/Event/ContentChannel';
import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { IOperationEvent } from 'Extension/Plugins/Elements/IOperations';
import { ControlType, OperationType } from 'Extension/Plugins/Elements/const';
import { IHandler, ISerializable } from 'Extension/Event/IEventEmitter';

class Store {
   protected _channel: ContentChannel = new ContentChannel('elements');
   // TODO: хранить в каком-то более адекватном виде
   protected _elements:
      | Array<{
      id: IControlNode['id'];
      name: IControlNode['name'];
      parentId?: IControlNode['parentId'];
      class?: string;
      depth?: number;
   }> = [];

   constructor() {
      this._channel.addListener('operation', this.__operationHandler.bind(this));
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

   setElements(newElements: Store['_elements']): void {
      //TODO: удалить после того как ключи будут браться из инферно
      this._elements = newElements;
   }

   private __operationHandler(args: IOperationEvent['args']): void {
      switch (args[0]) {
         case OperationType.DELETE:
            this.__removeNode(args[1]);
            break;
         case OperationType.UPDATE:
            break;
         case OperationType.CREATE:
            this.__addNode(args[1], args[2], args[3], args[4]);
            break;
         case OperationType.REORDER:
            break;
      }
   }

   private __removeNode(id: IControlNode['id']): void {
      const nodeIndex = this._elements.findIndex((node) => node.id === id);
      if (nodeIndex !== -1) {
         this._elements.splice(nodeIndex, 1);
      }
   }

   private __addNode(
      id: IControlNode['id'],
      name: IControlNode['name'],
      controlType: ControlType,
      parentId?: IControlNode['parentId']
   ): void {
      if (!parentId) {
         this._elements.push({
            id,
            name,
            parentId,
            class: this.__getClassByControlType(controlType),
            depth: 0
         });
      } else {
         // TODO: сделать добавление в произвольное место
         const parentIndex = this._elements.findIndex((element) => element.id === parentId);
         let lastChildIndex = parentIndex + 1;
         if (parentIndex === -1) {
            /**
             * TODO: иногда возникают циклические зависимости (пока такое встречалось только в попапах), и "родитель" приходит раньше "ребёнка"
             * Засовываем такие поддеревья в корень, чтобы хоть как-то их показать
             */
            lastChildIndex = 0;
         } else {
            while (this._elements[lastChildIndex] && this._elements[lastChildIndex].depth > this._elements[parentIndex].depth) {
               lastChildIndex++;
            }
         }
         this._elements.splice(lastChildIndex, 0, {
            id,
            name,
            parentId,
            class: this.__getClassByControlType(controlType),
            depth: this.__getDepth(parentId)
         });
      }
   }

   private __getClassByControlType(controlType: ControlType): string {
      //TODO: это должно быть в Elements
      switch (controlType) {
         case ControlType.HOC:
            return 'Elements__node_hoc';
         case ControlType.CONTROL:
            return 'Elements__node_control';
         case ControlType.TEMPLATE:
            return 'Elements__node_template';
      }
   }

   private __getDepth(parentId?: IControlNode['parentId']): number {
      if (parentId) {
         const parent = this._elements.find((element) => element.id === parentId);
         if (parent) {
            return parent.depth + 1;
         }
      }
      return 0;
   }
}

export default Store;

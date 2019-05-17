import { IWasabyDevHook } from './IHook';
import Agent from './Agent';
import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { OperationType } from 'Extension/Plugins/Elements/const';
import { ISerializable } from 'Extension/Event/IEventEmitter';

export class Hook implements IWasabyDevHook {
   private agent: Agent = new Agent();
   private messageQueue: Array<[string, ISerializable?]> = [];

   onStartCommit(node: IControlNode): void {
      // TODO: тут нужно будет запоминать текущий рендерящийся контрол, возможно замерять время
   }

   onEndCommit(node: IControlNode, typeOfOperation: OperationType): void {
      this.agent.handleOperation(typeOfOperation, node);
   }

   init(): void {
      // TODO: поменять цвет иконки, создать вкладку в дев тулзах, загрузить плагины, навесить всякие обработчики
   }

   pushMessage(eventName: string, args?: ISerializable): void {
      this.messageQueue.push([eventName, args]);
   }

   readMessageQueue(): Array<[string, ISerializable?]> {
      const messages = this.messageQueue.slice();
      this.messageQueue = [];
      return messages;
   }
}

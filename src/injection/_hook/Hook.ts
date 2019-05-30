import { IWasabyDevHook } from './IHook';
import Agent from './Agent';
import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { OperationType } from 'Extension/Plugins/Elements/const';
import { ISerializable } from 'Extension/Event/IEventEmitter';

export class Hook implements IWasabyDevHook {
   private agent: Agent = new Agent();
   private messageQueue: Array<[string, ISerializable?]> = [];

   onStartCommit(node: IControlNode, typeOfOperation: OperationType): void {
      this.agent.onStartCommit(node, typeOfOperation);
   }

   onEndCommit(node: IControlNode): void {
      this.agent.onEndCommit(node);
   }

   onStartSync(rootId: IControlNode['id'], instanceId: string): void {
      this.agent.onStartSync(rootId + instanceId);
   }

   onEndSync(rootId: IControlNode['id'], instanceId: string): void {
      this.agent.onEndSync(rootId + instanceId);
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

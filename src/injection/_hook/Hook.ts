import { IWasabyDevHook } from './IHook';
import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { OperationType } from 'Extension/Plugins/Elements/const';
import { ISerializable } from 'Extension/Event/IEventEmitter';
import Agent from './Agent';

export class Hook implements IWasabyDevHook {
   private _agent: Agent;
   private _messageQueue: Array<[string, ISerializable?]> = [];

   constructor(agent: Agent) {
      this._agent = agent;
   }

   onStartCommit(node: IControlNode, typeOfOperation: OperationType): void {
      this._agent.onStartCommit(node, typeOfOperation);
   }

   onEndCommit(node: IControlNode): void {
      this._agent.onEndCommit(node);
   }

   onStartSync(rootId: IControlNode['id'], instanceId: string): void {
      this._agent.onStartSync(rootId + instanceId);
   }

   onEndSync(rootId: IControlNode['id'], instanceId: string): void {
      this._agent.onEndSync(rootId + instanceId);
   }

   init(): void {
      // TODO: поменять цвет иконки, создать вкладку в дев тулзах, загрузить плагины, навесить всякие обработчики
   }

   pushMessage(eventName: string, args?: ISerializable): void {
      this._messageQueue.push([eventName, args]);
   }

   readMessageQueue(): Array<[string, ISerializable?]> {
      const messages = this._messageQueue.slice();
      this._messageQueue = [];
      return messages;
   }
}

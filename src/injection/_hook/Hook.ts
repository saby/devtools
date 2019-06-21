import { IWasabyDevHook } from './IHook';
import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { OperationType } from 'Extension/Plugins/Elements/const';
import { ISerializable } from 'Extension/Event/IEventEmitter';
import Agent from './Agent';

/**
 * Rethrows error asynchronously to avoid breaking the calling code.
 */
function rethrowError(e: Error): void {
   setTimeout(() => {
      throw e;
   }, 0);
}

export class Hook implements IWasabyDevHook {
   private _agent: Agent;
   private _messageQueue: Array<[string, ISerializable?]> = [];

   constructor(agent: Agent) {
      this._agent = agent;
   }

   onStartCommit(node: IControlNode, typeOfOperation: OperationType): void {
      try {
         this._agent.onStartCommit(node, typeOfOperation);
      } catch (e) {
         rethrowError(e);
      }
   }

   onEndCommit(node: IControlNode): void {
      try {
         this._agent.onEndCommit(node);
      } catch (e) {
         rethrowError(e);
      }
   }

   onStartSync(rootId: IControlNode['id'], instanceId: string): void {
      try {
         this._agent.onStartSync(rootId + instanceId);
      } catch (e) {
         rethrowError(e);
      }
   }

   onEndSync(rootId: IControlNode['id'], instanceId: string): void {
      try {
         this._agent.onEndSync(rootId + instanceId);
      } catch (e) {
         rethrowError(e);
      }
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

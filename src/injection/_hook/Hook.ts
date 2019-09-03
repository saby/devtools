import { IWasabyDevHook } from 'Types/IHook';
import { IBackendControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { OperationType } from 'Extension/Plugins/Elements/const';
import { ISerializable } from 'Extension/Event/IEventEmitter';
import Agent from './Agent';
import { INamedLogger } from 'Extension/Logger/ILogger';
import { IRenderer } from 'Extension/Plugins/Elements/IRenderer';

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
   private _logger: INamedLogger;

   constructor(logger: INamedLogger) {
      this._logger = logger;
      // TODO: убрать после того как откажемся от поддержки 610 версии. Там есть проверка на hasOwnProperty
      this.onStartLifecycle = this._onStartLifecycle.bind(this);
   }

   onStartCommit(
      typeOfOperation: OperationType,
      name: string,
      oldNode?: object
   ): number {
      if (this._agent) {
         try {
            return this._agent.onStartCommit(typeOfOperation, name, oldNode);
         } catch (e) {
            rethrowError(e);
         }
      }
      return -1;
   }

   onEndCommit(id: IBackendControlNode['id'], node: IBackendControlNode): void {
      if (this._agent) {
         try {
            this._agent.onEndCommit(id, node);
         } catch (e) {
            rethrowError(e);
         }
      }
   }

   _onStartLifecycle(id: IBackendControlNode['id']): void {
      if (this._agent) {
         try {
            this._agent.onStartLifecycle(id);
         } catch (e) {
            rethrowError(e);
         }
      }
   }

   onEndLifecycle(currentNode: object, data: IBackendControlNode): void {
      if (this._agent) {
         try {
            this._agent.onEndLifecycle(currentNode, data);
         } catch (e) {
            rethrowError(e);
         }
      }
   }

   onStartSync(rootId: string): void {
      if (this._agent) {
         try {
            this._agent.onStartSync(rootId);
         } catch (e) {
            rethrowError(e);
         }
      }
   }

   onEndSync(rootId: string): void {
      if (this._agent) {
         try {
            this._agent.onEndSync(rootId);
         } catch (e) {
            rethrowError(e);
         }
      }
   }

   init(renderer?: IRenderer): void {
      if (renderer) {
         this._agent = new Agent({
            logger: this._logger,
            renderer
         });
      }
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

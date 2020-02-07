import { IWasabyDevHook } from 'Types/IHook';
import {
   IBackendControlNode,
   IControlChanges,
   IControlNode,
   ITemplateChanges,
   ITemplateNode,
   IWasabyElement
} from 'Extension/Plugins/Elements/IControlNode';
import { OperationType } from 'Extension/Plugins/Elements/const';
import { ISerializable } from 'Extension/Event/IEventEmitter';
import Agent from './Agent';
import { INamedLogger } from 'Extension/Logger/ILogger';
import { IRenderer } from 'Extension/Plugins/Elements/IRenderer';
import { GlobalMessages } from 'Extension/const';
import { getGlobalChannel } from '../_devtool/globalChannel';

/**
 * Rethrows error asynchronously to avoid breaking the calling code.
 */
function rethrowError(e: Error): void {
   setTimeout(() => {
      throw e;
   }, 0);
}

/**
 * Manages communication between an agent and a framework.
 * Also contains some fields which frontend uses to get access to things living in a page context (functions, objects, etc.).
 * @author Зайцев А.С.
 */
export class Hook implements IWasabyDevHook {
   private _breakpoints?: IWasabyDevHook['_breakpoints'];
   private _agent: Agent;
   private _messageQueue: Array<[string, ISerializable?]> = [];
   private _logger: INamedLogger;
   private _initialized: boolean = false;
   $0: IWasabyElement;

   constructor(logger: INamedLogger) {
      this._logger = logger;
   }

   onStartCommit(
      typeOfOperation: OperationType,
      name: string,
      oldNode?: IControlNode | ITemplateNode
   ): void {
      if (this._agent) {
         try {
            this._agent.onStartCommit(typeOfOperation, name, oldNode);
         } catch (e) {
            rethrowError(e);
         }
      }
   }

   onEndCommit(
      node: IBackendControlNode,
      data?: ITemplateChanges | IControlChanges
   ): void {
      if (this._agent) {
         try {
            this._agent.onEndCommit(node, data);
         } catch (e) {
            rethrowError(e);
         }
      }
   }

   saveChildren(children: ITemplateNode['children'] | IControlNode['markup']): void {
      if (this._agent) {
         try {
            this._agent.saveChildren(children);
         } catch (e) {
            rethrowError(e);
         }
      }
   }

   onStartLifecycle(node: IControlNode): void {
      if (this._agent) {
         try {
            this._agent.onStartLifecycle(node);
         } catch (e) {
            rethrowError(e);
         }
      }
   }

   onEndLifecycle(node: IControlNode): void {
      if (this._agent) {
         try {
            this._agent.onEndLifecycle(node);
         } catch (e) {
            rethrowError(e);
         }
      }
   }

   onStartSync(rootId: number): void {
      if (this._agent) {
         try {
            this._agent.onStartSync(rootId);
         } catch (e) {
            rethrowError(e);
         }
      }
   }

   onEndSync(rootId: number): void {
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
            logger: this._logger
         });
         this._initialized = true;
         getGlobalChannel().addListener(GlobalMessages.devtoolsClosed, () => {
            this._breakpoints = undefined;
         });
      }
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

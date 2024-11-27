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
import { GlobalMessages } from 'Extension/const';
import { getGlobalChannel } from '../_devtool/globalChannel';
import { IExtensionOptions } from 'Extension/Utils/loadOptions';

/**
 * Manages communication between an agent and a framework.
 * Also contains some fields which frontend uses to get access to things living in a page context (functions, objects, etc.).
 * @author Зайцев А.С.
 */
export class Hook implements IWasabyDevHook {
   saveReactivePropsStacks: boolean =
      window.wasabyDevtoolsOptions?.saveReactivePropsStacks;
   _$hasWasaby: boolean = false;
   _$hasChangedTabs: boolean = false;
   _breakpoints?: IWasabyDevHook['_breakpoints'];
   private _agent: Agent;
   private _messageQueue: Array<[string, ISerializable?]> = [];
   private _logger: INamedLogger;
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
         this._agent.onStartCommit(typeOfOperation, name, oldNode);
      }
   }

   onEndCommit(
      node: IBackendControlNode,
      data?: ITemplateChanges | IControlChanges
   ): void {
      if (this._agent) {
         this._agent.onEndCommit(node, data);
      }
   }

   saveChildren(
      children: ITemplateNode['children'] | IControlNode['markup']
   ): void {
      if (this._agent) {
         this._agent.saveChildren(children);
      }
   }

   onStartLifecycle(node: IControlNode): void {
      if (this._agent) {
         this._agent.onStartLifecycle(node);
      }
   }

   onEndLifecycle(node: IControlNode): void {
      if (this._agent) {
         this._agent.onEndLifecycle(node);
      }
   }

   onStartSync(rootId: number): void {
      if (this._agent) {
         this._agent.onStartSync(rootId);
      }
   }

   onEndSync(rootId: number): void {
      if (this._agent) {
         this._agent.onEndSync(rootId);
      }
   }

   init(): void {
      const tabs = window.wasabyDevtoolsOptions?.tabs;
      const pluginEnabled =
         tabs?.includes('Elements') || tabs?.includes('Profiler');
      this._$hasWasaby = true;
      if (pluginEnabled) {
         this._agent = new Agent({
            logger: this._logger
         });
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

   _$onTabsChanged(tabs: IExtensionOptions['tabs']): void {
      this._$hasChangedTabs = true;
   }
}

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
import { IExtensionOptions } from 'Extension/Utils/loadOptions';

type Breakpoint = [
   Function, // handler
   string, // condition
   IBackendControlNode['id'], // id of the control which handler will be called
   IBackendControlNode['id'] // id of the first control to which breakpoints were added
];

export interface IWasabyDevHook {
   _$hasWasaby: boolean;
   _$hasChangedTabs: boolean;
   $0: IWasabyElement;
   saveReactivePropsStacks: boolean;
   __node?: IBackendControlNode;
   __template?: Function;
   __constructor?: Function;
   __container?: IWasabyElement;
   __function?: Function;
   _breakpoints?: Breakpoint[];
   onStartCommit(
      operation: OperationType,
      name: string,
      oldNode?: IControlNode | ITemplateNode
   ): void;
   onStartLifecycle(node: IControlNode): void;
   onEndCommit(
      node: IBackendControlNode,
      data?: ITemplateChanges | IControlChanges
   ): void;
   onEndLifecycle(node: IControlNode): void;
   onStartSync(rootId: number): void;
   onEndSync(rootId: number): void;
   init(): void;
   pushMessage(eventName: string, args?: ISerializable): void;
   _$onTabsChanged(tabs: IExtensionOptions['tabs']): void;
}

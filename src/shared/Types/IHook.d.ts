import {
   IBackendControlNode,
   IWasabyElement
} from 'Extension/Plugins/Elements/IControlNode';
import { OperationType } from 'Extension/Plugins/Elements/const';
import { ISerializable } from 'Extension/Event/IEventEmitter';

export interface IWasabyDevHook {
   onStartCommit: (
      typeOfOperation: OperationType,
      name: string,
      oldNode?: object
   ) => number;
   onStartLifecycle: (id: IBackendControlNode['id']) => void;
   onEndCommit: (
      id: IBackendControlNode['id'],
      node: IBackendControlNode
   ) => void;
   onEndLifecycle: (currentNode: object, data: IBackendControlNode) => void;
   onStartSync: (rootId: string) => void;
   onEndSync: (rootId: string) => void;
   init: () => void;
   pushMessage: (eventName: string, args?: ISerializable) => void;
   $0: IWasabyElement;
   _initialized: boolean;
   __node?: IBackendControlNode;
   __template?: Function;
   __constructor?: Function;
   __container?: IWasabyElement;
   __function?: Function;
}

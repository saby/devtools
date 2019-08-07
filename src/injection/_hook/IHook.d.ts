import { IBackendControlNode, IWasabyElement } from 'Extension/Plugins/Elements/IControlNode';
import { OperationType } from 'Extension/Plugins/Elements/const';
import { ISerializable } from 'Extension/Event/IEventEmitter';

export interface IWasabyDevHook {
   onStartCommit: (node: IBackendControlNode, typeOfOperation: OperationType) => void;
   onEndCommit: (node: IBackendControlNode) => void;
   onStartSync: (rootId: IBackendControlNode['id'], instanceId: string) => void;
   onEndSync: (rootId: IBackendControlNode['id'], instanceId: string) => void;
   init: () => void;
   pushMessage: (eventName: string, args?: ISerializable) => void;
   $0: IWasabyElement;
   __node?: IBackendControlNode;
   __template?: Function;
   __constructor?: Function;
   __container?: IWasabyElement;
   __function?: Function;
}

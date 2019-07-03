import { IControlNode, IWasabyElement } from 'Extension/Plugins/Elements/IControlNode';
import { OperationType } from 'Extension/Plugins/Elements/const';
import { ISerializable } from 'Extension/Event/IEventEmitter';

export interface IWasabyDevHook {
   onStartCommit: (node: IControlNode, typeOfOperation: OperationType) => void;
   onEndCommit: (node: IControlNode) => void;
   onStartSync: (rootId: IControlNode['id'], instanceId: string) => void;
   onEndSync: (rootId: IControlNode['id'], instanceId: string) => void;
   init: () => void;
   pushMessage: (eventName: string, args?: ISerializable) => void;
   $0: IWasabyElement;
   __node?: IControlNode;
   __template?: Function;
   __constructor?: Function;
   __container?: IWasabyElement;
   __function?: Function;
}

import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { OperationType } from 'Extension/Plugins/Elements/const';

export interface IWasabyDevHook {
   onStartCommit: (node: IControlNode, typeOfOperation: OperationType) => void;
   onEndCommit: (node: IControlNode) => void;
   onStartSync: (rootId: IControlNode['id'], instanceId: string) => void;
   onEndSync: (rootId: IControlNode['id'], instanceId: string) => void;
   init: () => void;
   __node?: IControlNode;
}

import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { OperationType } from 'Extension/Plugins/Elements/const';

export interface IWasabyDevHook {
   onStartCommit: (node: IControlNode) => void;
   onEndCommit: (node: IControlNode, typeOfOperation: OperationType) => void;
   init: () => void;
   __node?: IControlNode;
}

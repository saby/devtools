import { IControlNode } from '../../interface/IControlNode';
import { OperationType } from '../RENAME/const';

export interface IWasabyDevHook {
   onStartCommit: (node: IControlNode) => void;
   onEndCommit: (node: IControlNode, typeOfOperation: OperationType) => void;
   init: () => void;
   __node?: IControlNode;
}

import { IControlNode, OperationType } from '../../extension/const';

export interface IWasabyDevHook {
   onStartCommit: (node: IControlNode) => void;
   onEndCommit: (node: IControlNode, typeOfOperation: OperationType) => void;
}

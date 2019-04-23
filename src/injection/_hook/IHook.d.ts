import { IControlNode, OperationType } from 'interface/Element';

export interface IWasabyDevHook {
   onStartCommit: (node: IControlNode) => void;
   onEndCommit: (node: IControlNode, typeOfOperation: OperationType) => void;
}

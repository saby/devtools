import { OperationType } from 'ExtensionCore/const';
import { IControlNode } from './IControlNode';
import { IMessageData } from './IContentMessage';

export interface IOperationEvent extends IMessageData {
   args: OperationPayload;
}

type OperationPayload =
   | [OperationType.REMOVE, IControlNode['id']]
   | [OperationType.UPDATE, IControlNode['id']]
   | [OperationType.ADD, IControlNode['id'], IControlNode['name']] //add root
   | [OperationType.ADD, IControlNode['id'], IControlNode['name'], IControlNode['parentId']] //add leaf
   | [OperationType.REORDER, IControlNode['id'], number, ...Array<IControlNode['id']>];

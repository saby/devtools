import { OperationType } from 'ExtensionCore/const';
import { IControlNode } from './IControlNode';
import { IMessageData } from './IContentMessage';

export interface IOperationEvent extends IMessageData {
   args: OperationPayload;
}

type OperationPayload =
   | [OperationType.REMOVE, IControlNode['id']]
   | [OperationType.ADD, IControlNode['id'], IControlNode['name']] //add root
   | [OperationType.ADD, IControlNode['id'], IControlNode['name'], IControlNode['parentId'], IControlNode['key']]; //add leaf

import { ControlType, OperationType } from './const';
import { IControlNode } from './IControlNode';
import { IMessageData } from 'Extension/Event/IContentMessage';

export interface IOperationEvent extends IMessageData {
   args: OperationPayload;
}

type OperationPayload =
   | [OperationType.DELETE, IControlNode['id']]
   | [OperationType.UPDATE, IControlNode['id']]
   | [OperationType.CREATE, IControlNode['id'], IControlNode['name'], ControlType] //add root
   | [OperationType.CREATE, IControlNode['id'], IControlNode['name'], ControlType, IControlNode['parentId']] //add leaf
   | [OperationType.REORDER, IControlNode['id'], number, ...Array<IControlNode['id']>];

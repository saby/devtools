import { ControlType, OperationType } from './const';
import { IBackendControlNode } from './IControlNode';
import { IMessageData } from 'Extension/Event/IContentMessage';

export interface IOperationEvent extends IMessageData {
   args: OperationPayload;
}

type OperationPayload =
   | [OperationType.DELETE, IBackendControlNode['id']]
   | [OperationType.UPDATE, IBackendControlNode['id']]
   | [
        OperationType.CREATE,
        IBackendControlNode['id'],
        IBackendControlNode['name'],
        ControlType
     ] // add root
   | [
        OperationType.CREATE,
        IBackendControlNode['id'],
        IBackendControlNode['name'],
        ControlType,
        IBackendControlNode['parentId'],
        IBackendControlNode['logicParentId']
     ] // add leaf
   | [
        OperationType.REORDER,
        IBackendControlNode['id'],
        ...Array<IBackendControlNode['id']>
     ];

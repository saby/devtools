export const PANEL_NAME = 'Wasaby';

export const UPDATE_MESSAGE = '';

export interface ITemplateNode {
   id: number;
   name: string;
   type: Function;
   options?: object;
   attributes?: object;
   eventHandlers?: Record<string, Function>;
}

export interface IControlNode extends ITemplateNode {
   state?: object;
}

export enum OperationType {
   REMOVE = 1,
   ADD,
   REORDER
}

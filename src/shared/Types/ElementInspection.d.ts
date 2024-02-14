import { IBackendControlNode } from 'Extension/Plugins/Elements/IControlNode';

export interface IInspectedElement {
   isControl: boolean;
   attributes?: IDehydratedData;
   changedAttributes?: IDehydratedData;
   state?: IDehydratedData;
   changedState?: IDehydratedData;
   options?: IDehydratedData;
   changedOptions?: IDehydratedData;
   events?: IDehydratedData;
}

interface IInspectedElementPayload {
   id: IBackendControlNode['id'];
   type: 'no-change' | 'not-found' | 'full' | 'path' | 'partial';
}

interface IInspectedElementNoChange extends IInspectedElementPayload {
   type: 'no-change';
}

interface IInspectedElementNotFound extends IInspectedElementPayload {
   type: 'not-found';
}

interface IInspectedElementFull extends IInspectedElementPayload {
   value: IInspectedElement;
   type: 'full';
}

interface IInspectedElementPath extends IInspectedElementPayload {
   value: IDehydratedData;
   path: Array<string | number>;
   type: 'path';
}

interface IInspectedElementPartial extends IInspectedElementPayload {
   value: IInspectedElement;
   type: 'partial';
}

export type InspectedElementPayload =
   | IInspectedElementNoChange
   | IInspectedElementNotFound
   | IInspectedElementFull
   | IInspectedElementPath
   | IInspectedElementPartial;

export type DehydratedItem =
   | {
        expandable: boolean;
        caption: string;
        type: 'object' | 'array';
     }
   | {
        type: 'regexp' | 'date' | 'function' | 'htmlElement';
        caption: string;
     }
   | {
        type: 'undefined';
     };

export type DehydrateReturnType =
   | string
   | boolean
   | null
   | DehydratedItem
   | DehydratedItem[]
   | DehydrateReturnType[]
   | { [prop: string]: DehydrateReturnType };

export interface IDehydratedData {
   cleaned: Array<Array<string | number>>;
   data: DehydrateReturnType;
}

export type ElementType =
   | 'null'
   | 'htmlElement'
   | 'jqueryElement'
   | 'undefined'
   | 'array'
   | 'regexp'
   | 'date'
   | 'object'
   | 'boolean'
   | 'function'
   | 'string'
   | 'number'
   | 'unknown';

export type InspectedPathsMap = Map<string | number, InspectedPathsMap>;

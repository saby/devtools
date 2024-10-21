import {
   IBackendControlNode,
   IFrontendControlNode
} from 'Extension/Plugins/Elements/IControlNode';
import { ControlUpdateReason } from 'Extension/Plugins/Elements/ControlUpdateReason';

export interface IBackendChangedReactiveProp {
   name: string;
   stack: string;
}

export interface IFrontendChangedReactiveProp {
   name: string;
   stack?: IStackFrame[];
}

export interface IStackFrame {
   name: string;
   url: string;
   lineNumber: number;
}

export interface IChangesDescription {
   selfDuration: number;
   lifecycleDuration: number;
   updateReason: ControlUpdateReason;
   domChanged: boolean;
   isVisible: boolean;
   unusedReceivedState: boolean;
   asyncControl: boolean;
   changedOptions?: string[];
   changedAttributes?: string[];
   changedReactiveProps?: string[] | IFrontendChangedReactiveProp[];
}

export interface IBackendSynchronizationDescription {
   selfDuration: number;
   changes: Array<[IBackendControlNode['id'], IChangesDescription]>;
}

export interface IBackendProfilingData {
   initialIdToDuration: Array<[IBackendControlNode['id'], number]>;
   syncList: Array<[string, IBackendSynchronizationDescription]>;
}

export interface IFrontendSynchronizationDescription {
   selfDuration: number;
   changes: Map<IFrontendControlNode['id'], IChangesDescription>;
}

export interface IFrontendProfilingData {
   initialIdToDuration: Map<IFrontendControlNode['id'], number>;
   synchronizationKeyToDescription: Map<
      string,
      IFrontendSynchronizationDescription
   >;
}

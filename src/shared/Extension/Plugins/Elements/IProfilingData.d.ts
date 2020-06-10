import { IBackendControlNode, IFrontendControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { ControlUpdateReason } from 'Extension/Plugins/Elements/ControlUpdateReason';

export interface IChangesDescription {
   selfDuration: number;
   updateReason: ControlUpdateReason;
   domChanged: boolean;
   isVisible: boolean;
   unusedReceivedState: boolean;
   asyncControl: boolean;
   changedOptions?: string[];
   changedAttributes?: string[];
   changedReactiveProps?: string[];
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
   synchronizationKeyToDescription: Map<string,
      IFrontendSynchronizationDescription>;
}

import { IBackendControlNode, IFrontendControlNode } from 'Extension/Plugins/Elements/IControlNode';

export interface IChangesDescription {
   selfDuration: number;
   isFirstRender: boolean;
   changedOptions?: string[];
   changedAttributes?: string[];
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

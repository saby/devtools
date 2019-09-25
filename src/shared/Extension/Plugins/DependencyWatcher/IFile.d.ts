import { IId } from 'Extension/Plugins/DependencyWatcher/interface';

interface IFileModules {
   modules: Set<number>;
}

interface ITransportModules {
   modules: number[];
}

export interface IFileInfo {
   size: number;
   name: string;
   path: string;
}

export interface IFile extends IFileInfo, IFileModules, IId {}

export interface ITransportFile extends IFileInfo, ITransportModules, IId {
   computedSize: string;
}

export interface IFileFilter {
   withoutSize: boolean;
   name: string;
}

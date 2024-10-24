import { IId } from 'Extension/Plugins/DependencyWatcher/interface';

interface IFileModules {
   modules: Set<number>;
}

interface ITransportModules {
   modules: number[];
}

export interface IFileInfo {
   name: string;
   path: string;
}

export interface IFile extends IFileInfo, IFileModules, IId {}

export interface ITransportFile extends IFileInfo, ITransportModules, IId {

}

export interface IFileFilter {
   name: string;
}

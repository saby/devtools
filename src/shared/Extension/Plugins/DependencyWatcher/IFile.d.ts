import { IId } from 'Extension/Plugins/DependencyWatcher/interface';

export interface IFileInfo {
   size: number;
   name: string;
   path: string;
}

export interface IFileModules {
   modules: Set<number>;
}

export interface ITransportModules {
   modules: number[];
}

export interface IFile extends IFileInfo, IFileModules, IId {}

export interface ITransportFile extends IFileInfo, ITransportModules, IId {}

export interface IFileFilter {
   withoutSize: boolean;
   name: string;
}

export type UpdateFileParam = IId &
   {
      [key in keyof IFileInfo]: IFileInfo[key];
   };

import { RPCMethods } from "Extension/Plugins/DependencyWatcher/const";
import { ModulesMap, ModulesRecord, TransferModule } from "Extension/Plugins/DependencyWatcher/IModule";
import { Bundles } from "Extension/Plugins/DependencyWatcher/EventData";
import { RPC } from "Extension/Event/RPC";
import { convertToMap } from "Extension/Plugins/DependencyWatcher/Module";
import { IFile } from "Extension/Plugins/DependencyWatcher/IFile";

export interface IRPCSourceConfig {
    rpc: RPC;
}

const getArrayFromSet = (set: IFile[]): Map<number, IFile> => {
    const map: Map<number, IFile> = new Map();
    set.forEach((file: IFile) => {
        map.set(file.id, file);
    });
    return map;
};

export class RPCSource {
    protected _rpc: RPC;
    private __lastQueryResult: ModulesRecord<TransferModule> = Object.create(null);
    private __lastBundles: Bundles;
    private __files: Map<number, IFile> = new Map();
    constructor({ rpc }: IRPCSourceConfig) {
        this._rpc = rpc;
    }

    protected _getModules(): Promise<ModulesMap> {
        return Promise.resolve().then(() => {
            if (!this.__lastQueryResult || !Object.keys(this.__lastQueryResult).length) {
                return this.__getModules();
            }
            return this.__getNewModules();
        }).then((modulesRecord: ModulesRecord<TransferModule>) => {
            this.__lastQueryResult = Object.assign(this.__lastQueryResult, modulesRecord);
            return convertToMap(this.__lastQueryResult);
        });
    }
    
    private __getNewModules(): Promise<ModulesRecord<TransferModule>> {
        return this._rpc.execute<string[]>({
            methodName: RPCMethods.getNewModules
        }).then((dependecies: string[]) => {
            if (!dependecies.length) {
                return Promise.resolve({});
            }
            return this.__getModules(dependecies);
        })
    }
    
    private __getModules(dependecies?: string[]): Promise<ModulesRecord<TransferModule>> {
        return this._rpc.execute<ModulesRecord<TransferModule>, string[] | void>({
            methodName: RPCMethods.getModules,
            args: dependecies
        });
    }

    protected _getBundles(): Promise<Bundles> {
        if (this.__lastBundles) {
            return Promise.resolve(this.__lastBundles);
        }
        return this._rpc.execute<Bundles>({
            methodName: RPCMethods.getBundles
        }).then((bundles) => {
            this.__lastBundles = bundles;
            return  bundles;
        });
    }
    protected _getFiles(keys?: number[]): Promise<Map<number, IFile>> {
        if (!keys) {
            return this.__getAllFiles();
        }
        const result: Map<number, IFile> = new Map();
        const needFindKeys: number[] = [];

        for (let id of keys ) {
            if (this.__files.has(id)) {
                result.set(id, <IFile> this.__files.get(id));
            } else {
                needFindKeys.push(id);
            }
        }
        if (!needFindKeys.length) {
            return Promise.resolve(result);
        }
        return this._rpc.execute<IFile[], number[]>({
            methodName: RPCMethods.getFiles,
            args: needFindKeys
        }).then((files: IFile[]) => {
            files.forEach((file: IFile) => {
                this.__files.set(file.id, file);
                result.set(file.id, file);
            });
            return result;
        });
    }
    private __getAllFiles(): Promise<Map<number, IFile>> {
        return this._rpc.execute<IFile[], number[]>({
            methodName: RPCMethods.getFiles
        }).then(getArrayFromSet);
    }
    
    protected _setSize(name: string, size: number): Promise<boolean> {
        return this._rpc.execute({
            methodName: RPCMethods.setSize,
            args: {
                name, size
            }
        })
    }
}

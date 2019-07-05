import { adapter, Model } from "Types/entity";

export interface ICompatibilityConfig {
    idProperty: string;
}

const ERROR_TEXT = 'Not implemented';

export class Compatibility {
    readonly '[Types/_source/ICrud]': boolean = true;
    static '[Types/_source/ICrud]': boolean = true;
    protected _idProperty: string;
    private __opt: unknown;
    protected _adapter = new adapter.Json;
    constructor({ idProperty }: ICompatibilityConfig) {
        this._idProperty = idProperty;
    }
    setOptions(opt: unknown) {
        this.__opt = opt;
    }
    getOptions() {
        return this.__opt || {};
    }
    getIdProperty() {
        return this._idProperty;
    }
    getAdapter() {
        return this._adapter;
    }
    
    
    read<TKey extends string, TMeta = unknown>(id: TKey, meta?: TMeta): Promise<Model> {
        return Promise.reject(new Error(ERROR_TEXT));
    }
    
    create(): Promise<any> {
        return Promise.reject(new Error(ERROR_TEXT));
    }
    
    update(): Promise<any> {
        return Promise.reject(new Error(ERROR_TEXT));
    }
    delete(): Promise<any> {
        return Promise.reject(new Error(ERROR_TEXT));
    }
}

import { adapter, Model } from "Types/entity";
import { deserialize } from "../util/id";

export interface ICompatibilityConfig {
    idProperty: string;
}

export class Compatibility {
    readonly '[Types/_source/ICrud]': boolean = true;
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
        // return Promise.resolve(module);
        // try {
        //     return Promise.resolve(this._read(id, meta));
        // }
        // catch (e) {
        //     console.log(e);
        let [ name ] = deserialize(id);
        return Promise.resolve(new Model({
            rawData: {
                name,
                child: false,
                id
            }
        }));
        // }
        
    }
    
    create(): Promise<any> {
        console.log('create', arguments);
        return Promise.reject(new Error('noup'))
    }
    
    update(): Promise<any>{
        console.log('update', arguments);
        return Promise.reject(new Error('noup'))
    }
    delete(): Promise<any>{
        console.log('delete', arguments);
        return Promise.reject(new Error('noup'))
    }
}

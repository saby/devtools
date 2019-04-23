type PrimitiveType = number | string | undefined | null;
interface ISerializableObject {
    [propName: string]: ISerializable;
}
export type ISerializable = PrimitiveType | ISerializableObject | Array<ISerializableObject | PrimitiveType>;

export type IHandler = (cfg: ISerializable) => void;

export interface IEventEmitter {
    addListener(event: string, listener: IHandler): this;
    removeListener(event: string, listener: IHandler): this;
    removeAllListeners(event?: string): this;
    dispatch(event: string, cfg: ISerializable): boolean;
    destructor();
}

export interface IEventEmitterConstructor {
    new (name: string): IEventEmitter;
}

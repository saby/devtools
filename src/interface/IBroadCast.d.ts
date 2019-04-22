type PrimitiveType = number | string | undefined | null;
interface ISerializableObject {
    [propName: string]: Serializable;
}
type Serializable = PrimitiveType | ISerializableObject | Array<ISerializableObject | PrimitiveType>;

export interface IBroadCast {
    addListener(event: string, listener: (cfg: ISerializableObject) => void): this;
    removeListener(event: string, listener: (cfg: ISerializableObject) => void): this;
    removeAllListeners(event?: string): this;
    emit(event: string, cfg: ISerializableObject): boolean;
}

export interface IBroadCastConstructor {
    new (name: string): IBroadCast;
}

type PrimitiveType = number | string | undefined | null | boolean;
// TODO: пока непонятно как правильно описать этот тип
// interface ISerializableObject {
//     [propName: string]: ISerializable;
// }
type ISerializableObject = object;
export type ISerializable =
   | PrimitiveType
   | ISerializableObject
   | Array<ISerializableObject | PrimitiveType>;

export type IHandler<T = ISerializable> = (arg: T) => void;

export interface IEventEmitter {
   addListener<T>(event: string, listener: IHandler<T>): this;
   removeListener<T>(event: string, listener: IHandler<T>): this;
   removeAllListeners(event?: string): this;
   dispatch(event: string, cfg?: ISerializable): boolean;
   destructor(): void;
}

export type IEventEmitterConstructor = new (name: string) => IEventEmitter;

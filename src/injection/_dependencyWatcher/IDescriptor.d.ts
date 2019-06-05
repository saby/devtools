import { IConfigWithStorage } from "./IConfig";

export interface IDescriptor {
    getDescriptor(): PropertyDescriptor;
}
export interface IDescriptorConstructor {
    new (config: IConfigWithStorage): IDescriptor;
}

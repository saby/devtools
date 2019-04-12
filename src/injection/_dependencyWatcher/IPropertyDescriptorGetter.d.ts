import { IConfig } from './IConfig';

interface IPropertyDescriptorGetter {
    (config: IConfig): PropertyDescriptor;
}

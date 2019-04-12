export type WithoutDependency<T> = {
    name: string;
    module: Function;
}
export type ArgsWithoutDependency = [
    string,
    Function
];

export type ArgsWithDependency = [
    string,
    Array<string>,
    Function
];

type PluginOption = {
    load: Function
}
export type ArgsInitPluginOptionOnly = [ PluginOption ]
export type ArgsInitPluginWithName = [
    string,
    PluginOption
]
export type ArgsInitPluginConstructor = [
    string,
    PluginOption
]

export type ArgsInitPlugin = ArgsInitPluginOptionOnly | ArgsInitPluginWithName;

export type Args<T = any> = ArgsWithDependency | ArgsWithoutDependency | ArgsInitPlugin;

export interface IDefine<T = any>{
    (...args: Array<Args<T>>): void;
}

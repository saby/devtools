type ArgsWithoutDependency = [string, Function];

type ArgsWithDependency = [string, string[], Function];

interface IPluginOption {
   load: Function;
}
type ArgsInitPluginOptionOnly = [IPluginOption];
type ArgsInitPluginWithName = [string, IPluginOption];
type ArgsInitPluginConstructor = [string, IPluginOption];

type ArgsInitPlugin = ArgsInitPluginOptionOnly | ArgsInitPluginWithName;

type Args<T = any> =
   | ArgsWithDependency
   | ArgsWithoutDependency
   | ArgsInitPlugin;

export type IDefine<T = any> = (...args: Array<Args<T>>) => void;

/**
 * Types for define.
 * @author Зайцев А.С.
 */
type ArgsWithoutDependency = [string, Function];

type ArgsWithDependency = [string, string[], Function];

type AnonymousModule = [Function];

type AnonymousModuleWithDependencies = [string[], Function];

interface IPluginOption {
   load: Function;
}
type ArgsInitPluginOptionOnly = [IPluginOption];
type ArgsInitPluginWithName = [string, IPluginOption];

type ArgsInitPlugin = ArgsInitPluginOptionOnly | ArgsInitPluginWithName;

export type DefineArgs =
   | ArgsWithDependency
   | ArgsWithoutDependency
   | ArgsInitPlugin
   | AnonymousModule
   | AnonymousModuleWithDependencies;

export type IDefine = (...args: DefineArgs[]) => void;

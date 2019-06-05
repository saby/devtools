import { EventNames } from "./const";

interface ModuleOperation {
    module: string;
}

export interface DefineModule extends ModuleOperation {
    dependencies?: string[];
    bundle?: string;
}

export interface AddDependency extends ModuleOperation {
    dependencies: string | string[]
}

export interface RequireModule {
    dependencies: string[]
}

export interface Update {

}

export interface Events extends Record<EventNames, unknown>{
    [EventNames.addDependency]: AddDependency;
    [EventNames.define]: DefineModule;
    [EventNames.require]: RequireModule;
    [EventNames.update]: Update;
}

export type Bundle = string[];
export type Bundles = Record<string, Bundle>

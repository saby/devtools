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

export interface Events extends Record<EventNames, ModuleOperation | RequireModule>{
    [EventNames.addDependency]: AddDependency;
    [EventNames.defineModule]: DefineModule;
    [EventNames.require]: RequireModule;
}

export type Bundle = string[];
export type Bundles = Record<string, Bundle>

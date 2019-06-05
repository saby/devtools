type IDeps = string |  string[];

interface IRequireConfig {

}

export interface ILocalRequire {
    <T>(dep: string): T;
    (): ILocalRequire;
    (deps: string[], callback?: Function, errback?: Function): ILocalRequire;
}

export interface IRequire extends ILocalRequire {
    (config: IRequireConfig): ILocalRequire;
    (config: IRequireConfig, deps: IDeps, callback?: Function, errback?: Function): ILocalRequire;
    config<T extends object>(cfg: T): void;
    toUrl(module: string): string;
}

export interface IRequireInitObject {
    bundles: Record<string, string[]>
}

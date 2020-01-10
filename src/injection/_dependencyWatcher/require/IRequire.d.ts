type IDeps = string | string[];

// tslint:disable-next-line:no-empty-interface
interface IRequireConfig {}

export type LocalRequire = (
   deps?: string | string[],
   callback?: Function,
   errback?: Function
) => LocalRequire | object;

export interface IRequire extends LocalRequire {
   (
      config: IRequireConfig,
      deps?: IDeps,
      callback?: Function,
      errback?: Function
   ): LocalRequire;
   config<T extends object>(cfg: T): void;
   toUrl(module: string): string;
   defined(module: string): boolean;
}

export interface IRequireInitObject {
   bundles: Record<string, string[]>;
   buildMode: string;
}

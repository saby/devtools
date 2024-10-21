/**
 * Types for require.
 * @author Зайцев А.С.
 */
type IDeps = string | string[];

export type LocalRequire = (
   deps?: string | string[],
   callback?: Function,
   errback?: Function
) => LocalRequire | object;

export interface IRequire extends LocalRequire {
   (
      config: object,
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

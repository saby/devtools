export interface ILogger {
   log(message: string): void;
   warn(message: string): void;
   error(error: Error): void;
}

export interface INamedLogger extends ILogger {
   create(name: string): INamedLogger;
}

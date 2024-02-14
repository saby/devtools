import { INamedLogger } from 'Extension/Logger/ILogger';

export abstract class AbstractLogger implements INamedLogger {
   protected _name: string;
   abstract log(message: string): void;
   abstract warn(message: string): void;
   abstract error(error: Error): void;
   protected abstract _create(name: string): AbstractLogger;
   create(name: string): INamedLogger {
      return this._create(`${this._name}/${name}`);
   }
}

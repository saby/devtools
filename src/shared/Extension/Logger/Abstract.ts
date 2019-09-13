import { INamedLogger } from 'Extension/Logger/ILogger';

export abstract class AbstractLogger implements INamedLogger {
   protected _name: string;
   abstract log(message: string): void;
   abstract warn(message: string): void;
   abstract error(error: Error): void;
   protected abstract _create(name: string): AbstractLogger;
   create(name: string): INamedLogger {
      const newName = this._name ? `${this._name}/${name}` : name;
      return this._create(newName);
   }
}

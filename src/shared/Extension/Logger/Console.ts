import { AbstractLogger } from 'Extension/Logger/Abstract';

export class ConsoleLogger extends AbstractLogger {
   constructor(protected _name: string) {
      super();
   }
   log(message: string): void {
      // tslint:disable-next-line:no-console
      console.log(this.__getName(), message);
   }
   warn(message: string): void {
      // tslint:disable-next-line:no-console
      console.warn(this.__getName(), message);
   }
   error(error: Error): void {
      // tslint:disable-next-line:no-console
      console.error(this.__getName(), error);
   }
   protected _create(name: string): ConsoleLogger {
      return new ConsoleLogger(name);
   }
   private __getName(): string {
      return `${this._name}: `;
   }
}

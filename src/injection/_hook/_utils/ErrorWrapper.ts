import Agent from '../Agent';
import { INamedLogger } from 'Extension/Logger/ILogger';

type FunctionProperties<T> = {
   [K in keyof T]: T[K] extends Function ? T[K] : never;
}[keyof T];

/**
 * Wraps functions to reduce the amount of logged errors.
 * When a function throws an error it gets added to functionsWithErrors and subsequent errors from it get ignored.
 * @author Зайцев А.С.
 */
class ErrorWrapper {
   private functionsWithErrors: Set<Function> = new Set();

   constructor(private logger: INamedLogger) {}

   resetErrors(): void {
      this.functionsWithErrors.clear();
   }

   wrapFunction<T extends FunctionProperties<Agent>>(func: T): T {
      return new Proxy(func, {
         apply: (
            target: T,
            thisArg: ThisParameterType<T>,
            argArray: Parameters<T>
         ): ReturnType<T> | void => {
            try {
               return target.apply(thisArg, argArray);
            } catch (e) {
               if (!this.functionsWithErrors.has(target)) {
                  this.functionsWithErrors.add(target);
                  this.logger.error(e);
               }
            }
         }
      });
   }
}

export default ErrorWrapper;

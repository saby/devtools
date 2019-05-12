import { IPlugin } from './IPlugin';
import { Hook } from './_hook/Hook';

export class InjectHook implements IPlugin {
   constructor() {
      // @ts-ignore
      if (window.__WASABY_DEV_HOOK__) {
         return;
      }
      Object.defineProperty(window, '__WASABY_DEV_HOOK__', {
         value: new Hook()
      });
   }
   static getName() {
      return 'InjectHook';
   }
}

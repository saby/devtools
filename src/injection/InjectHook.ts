import { IPlugin } from './IPlugin';
import { Hook } from './_hook/Hook';
import Agent from './_hook/Agent';

export class InjectHook implements IPlugin {
   private _agent: Agent;
   constructor() {
      // @ts-ignore
      if (window.__WASABY_DEV_HOOK__) {
         return;
      }
      this._agent = new Agent();
      Object.defineProperty(window, '__WASABY_DEV_HOOK__', {
         value: new Hook(this._agent)
      });
   }
   getCurrentModuleName(): string {
      return this._agent.getCurrentModuleName();
   }
   static getName() {
      return 'InjectHook';
   }
}

import { IPlugin, IPluginConfig } from './IPlugin';
import { Hook } from './_hook/Hook';
import Agent from './_hook/Agent';

export class InjectHook implements IPlugin {
   private _agent: Agent;
   constructor(config: IPluginConfig) {
      if (window.__WASABY_DEV_HOOK__) {
         return;
      }
      this._agent = new Agent({
         logger: config.logger
      });
      Object.defineProperty(window, '__WASABY_DEV_HOOK__', {
         value: new Hook(this._agent)
      });
   }
   static getName(): string {
      return 'InjectHook';
   }
}

import { IPlugin, IPluginConfig } from './IPlugin';
import { Hook } from './_hook/Hook';

export class InjectHook implements IPlugin {
   constructor(config: IPluginConfig) {
      if (window.__WASABY_DEV_HOOK__) {
         return;
      }
      Object.defineProperty(window, '__WASABY_DEV_HOOK__', {
         value: new Hook(config.logger)
      });
   }
   static getName(): string {
      return 'InjectHook';
   }
}

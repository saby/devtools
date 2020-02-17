import { Define } from './_dependencyWatcher/Define';
import { Require } from './_dependencyWatcher/Require';
import { DEFINE, REQUIRE } from './_dependencyWatcher/const';
import { IPlugin, IPluginConfig } from './IPlugin';
import { IEventEmitter } from 'Extension/Event/IEventEmitter';
import { RPC } from 'Extension/Event/RPC';
import {
   EventNames,
   PLUGIN_NAME
} from 'Extension/Plugins/DependencyWatcher/const';
import { GLOBAL } from './const';
import { ModuleStorage } from './_dependencyWatcher/storage/Module';
import debounce from 'Extension/Utils/debounce';
import { INamedLogger } from 'Extension/Logger/ILogger';
import registerRPCMethods from './_dependencyWatcher/registerRPCMethods';
import { IDescriptor } from './_dependencyWatcher/IDescriptor';

const SEC = 1000;

export class DependencyWatcher implements IPlugin {
   private readonly _channel: IEventEmitter;
   private readonly _logger: INamedLogger;
   private readonly _storage: ModuleStorage;
   constructor({ channel, logger }: IPluginConfig) {
      this._channel = channel;
      this._logger = logger;
      this._storage = this.__createStorage();

      const require = new Require({
         moduleStorage: this._storage,
         logger: this._logger.create('require')
      });
      const define = new Define({
         moduleStorage: this._storage
      });

      registerRPCMethods({
         rpc: new RPC({ channel: this._channel }),
         require,
         logger,
         moduleStorage: this._storage
      });

      if (this.__defineProperty(require, REQUIRE)) {
         let defined: object | undefined;
         if (
            GLOBAL[REQUIRE] &&
            GLOBAL[REQUIRE].s &&
            GLOBAL[REQUIRE].s.contexts &&
            GLOBAL[REQUIRE].s.contexts._ &&
            GLOBAL[REQUIRE].s.contexts._.defined
         ) {
            defined = { ...GLOBAL[REQUIRE].s.contexts._.defined };
         }
         if (defined) {
            this._logger.warn(
               `Не удалось вовремя переопределить require, возможны проблемы с модулями: ${Object.keys(
                  defined
               ).toString()}`
            );
         }

         this.__defineProperty(define, DEFINE);
      }
   }

   private __createStorage(): ModuleStorage {
      return new ModuleStorage(
         debounce(() => {
            this._channel.dispatch(EventNames.update, {});
         }, SEC)
      );
   }
   private __defineProperty(desc: IDescriptor, name: string): boolean {
      const descriptor = desc.getDescriptor();
      const existingDescriptor = Object.getOwnPropertyDescriptor(GLOBAL, name);
      try {
         if (existingDescriptor) {
            if (existingDescriptor.configurable) {
               /*
                * TODO: этот кусок расширения очень сильно завязан на require, причем тот, что
                * используется в тензоре. Он не configurable, так что если он не наш, то просто ничего не делаем.
                * Если пытаться перебивать чужой require, то это часто роняет сайты и пока непонятно
                * как максимально безопасно перебивать его везде.
                */
               return false;
            } else {
               descriptor.set(GLOBAL[name]);
               GLOBAL[name] = descriptor.get();
               return true;
            }
         } else {
            Object.defineProperties(GLOBAL, {
               [name]: descriptor
            });
            return true;
         }
      } catch (error) {
         this._logger.error(error);
         return false;
      }
   }

   static getName(): string {
      return PLUGIN_NAME;
   }
}

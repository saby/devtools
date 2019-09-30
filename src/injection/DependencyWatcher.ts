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
import { RPCResponse } from './_dependencyWatcher/RPCResponse';
import { IDescriptor } from './_dependencyWatcher/IDescriptor';

const SEC = 1000;

export class DependencyWatcher implements IPlugin {
   private readonly _channel: IEventEmitter;
   private readonly _logger: INamedLogger;
   private _rpc: RPCResponse;
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
         moduleStorage: this._storage,
         logger: this._logger.create('define')
      });

      this._rpc = new RPCResponse({
         rpc: new RPC({ channel: this._channel }),
         require,
         logger,
         moduleStorage: this._storage
      });

      this.__defineProperty(require, REQUIRE).then(() => {
         try {
            let defined: object | undefined;
            if (GLOBAL[REQUIRE] && GLOBAL[REQUIRE].s && GLOBAL[REQUIRE].s.contexts && GLOBAL[REQUIRE].s.contexts._ && GLOBAL[REQUIRE].s.contexts._.defined) {
               defined = { ...GLOBAL[REQUIRE].s.contexts._.defined };
            }
            if (defined) {
               this._logger.warn(
                  `Не удалось вовремя переопределить require, возможны проблемы с модулями: ${Object.keys(
                     defined
                  ).toString()}`
               );
            }
         } catch (error) {
            this._logger.error(error);
         }
      }).then(() => {
         return this.__defineProperty(define, DEFINE);
      }).catch(() => {
         // ignore
      });
   }

   private __createStorage(): ModuleStorage {
      return new ModuleStorage(
         debounce(() => {
            this._channel.dispatch(EventNames.update, {});
         }, SEC)
      );
   }
   private __defineProperty(desc: IDescriptor, name: string): Promise<void> {
      const descriptor = desc.getDescriptor();
      const existingDescriptor = Object.getOwnPropertyDescriptor(GLOBAL, name);
      return new Promise<void>((resolve, reject) => {
         try {
            if (existingDescriptor) {
               if (existingDescriptor.configurable) {
                  /*
                   * TODO: этот кусок расширения очень сильно завязан на require, причем тот, что
                   * используется в тензоре. Он не configurable, так что если он не наш, то просто ничего не делаем.
                   * Если пытаться перебивать чужой require, то это часто роняет сайты и пока непонятно
                   * как максимально безопасно перебивать его везде.
                   */
                  reject();
               } else {
                  // @ts-ignore
                  descriptor.set(GLOBAL[name]);
                  // @ts-ignore
                  GLOBAL[name] = descriptor.get();
               }
            } else {
               Object.defineProperties(GLOBAL, {
                  [name]: descriptor
               });
            }
            resolve();
         } catch (e) {
            reject(e);
         }
      });
   }

   static getName(): string {
      return PLUGIN_NAME;
   }
}

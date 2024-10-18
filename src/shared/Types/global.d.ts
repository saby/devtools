import { IWasabyDevHook } from './IHook';
import { IBackendControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { IExtensionOptions } from 'Extension/Utils/loadOptions';

declare global {
   // tslint:disable-next-line: interface-name
   interface Window {
      __WASABY_DEV_HOOK__: IWasabyDevHook;
      __WASABY_START_PROFILING?: boolean;
      // TODO: скорее всего лишнее поле
      __WASABY_DEV_MODULE__?: Function;
      $wasaby?: IBackendControlNode;
      $tmp?: unknown;
      wasabyDevtoolsOptions: IExtensionOptions;
      devtoolsPanel: {
         panelShownCallback: () => void;
         panelHiddenCallback: () => void;
      };
   }
}

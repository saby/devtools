import { IWasabyDevHook } from './IHook';
import { IBackendControlNode } from 'Extension/Plugins/Elements/IControlNode';

declare global {
   // tslint:disable-next-line: interface-name
   interface Window {
      __WASABY_DEV_HOOK__: IWasabyDevHook;
      __WASABY_START_PROFILING?: boolean;
      $wasaby?: IBackendControlNode;
      $tmp?: unknown;
      wasabyDevtoolsOptions?: {
         useUserTimingAPI?: boolean;
      };
      elementsPanel: {
         panelShownCallback: () => void;
         panelHiddenCallback: () => void;
      };
   }
}

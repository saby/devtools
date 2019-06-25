interface IExtensionOptions {
   useUserTimingAPI: boolean;
}

const defaultOptions: IExtensionOptions = {
   useUserTimingAPI: false
};

export function loadOptionsSync <IConfig extends IExtensionOptions> (callback: (cfg: Partial<IConfig>) => void) {
   const keys: Array<keyof IExtensionOptions> = ['useUserTimingAPI'];
   chrome.storage.sync.get(keys, (result: object) => {
      callback(<Partial<IConfig>> {
         ...defaultOptions,
         ...result
      });
   });
}
export function loadOptions(): Promise<IExtensionOptions> {
   return new Promise((resolve) => {
      // @ts-ignore
      loadOptionsSync(resolve);
   });
}

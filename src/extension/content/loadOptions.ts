interface IExtensionOptions {
   useUserTimingAPI: boolean;
}

const defaultOptions: IExtensionOptions = {
   useUserTimingAPI: false
};

export function loadOptions<IConfig extends IExtensionOptions>(): Promise<
   Partial<IExtensionOptions>
> {
   return new Promise((resolve) => {
      const keys: Array<keyof IExtensionOptions> = ['useUserTimingAPI'];
      chrome.storage.sync.get(keys, (result: object) => {
         resolve({
            ...defaultOptions,
            ...result
         } as Partial<IConfig>);
      });
   });
}

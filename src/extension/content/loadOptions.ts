interface IExtensionOptions {
   useUserTimingAPI: boolean;
   saveReactivePropsStacks: boolean;
}

const defaultOptions: IExtensionOptions = {
   useUserTimingAPI: false,
   saveReactivePropsStacks: false
};

export function loadOptions<IConfig extends IExtensionOptions>(): Promise<
   Partial<IExtensionOptions>
> {
   return new Promise((resolve) => {
      const keys: Array<keyof IExtensionOptions> = [
         'useUserTimingAPI',
         'saveReactivePropsStacks'
      ];
      chrome.storage.sync.get(keys, (result: object) => {
         resolve({
            ...defaultOptions,
            ...result
         } as Partial<IConfig>);
      });
   });
}

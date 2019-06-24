interface IExtensionOptions {
   useUserTimingAPI: boolean;
}

const defaultOptions: IExtensionOptions = {
   useUserTimingAPI: false
};

export function loadOptions(): Promise<IExtensionOptions> {
   return new Promise((resolve) => {
      const keys: Array<keyof IExtensionOptions> = ['useUserTimingAPI'];
      chrome.storage.sync.get(keys, (result) => {
         resolve({
            ...defaultOptions,
            ...result
         });
      });
   });
}

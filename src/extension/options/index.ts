interface IExtensionOptions {
   useUserTimingAPI: boolean;
}

const defaultOptions: IExtensionOptions = {
   useUserTimingAPI: false
};

function loadOptions(): Promise<IExtensionOptions> {
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

loadOptions().then((options) => {
   const userTimingAPIToggler = document.getElementsByName(
      'useUserTimingAPI'
   )[0] as HTMLInputElement;

   userTimingAPIToggler.checked = options.useUserTimingAPI;
   userTimingAPIToggler.addEventListener('change', (e) => {
      chrome.storage.sync.set({
         useUserTimingAPI: userTimingAPIToggler.checked
      });
   });
});

interface IExtensionOptions {
   useUserTimingAPI: boolean;
   saveReactivePropsStacks: boolean;
   theme: 'dark' | 'light' | 'devtools';
}

const defaultOptions: IExtensionOptions = {
   useUserTimingAPI: false,
   saveReactivePropsStacks: false,
   theme: 'devtools'
};

function loadOptions(): Promise<IExtensionOptions> {
   return new Promise((resolve) => {
      const keys: Array<keyof IExtensionOptions> = [
         'useUserTimingAPI',
         'theme',
         'saveReactivePropsStacks'
      ];
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

   const themeChooser = document.getElementsByName(
      'themeChooser'
   )[0] as HTMLSelectElement;

   themeChooser.value = options.theme;
   themeChooser.addEventListener('change', () => {
      chrome.storage.sync.set({
         theme: themeChooser.value
      });
   });

   const saveReactivePropsStacks = document.getElementsByName(
      'saveReactivePropsStacks'
   )[0] as HTMLInputElement;

   saveReactivePropsStacks.checked = options.saveReactivePropsStacks;
   saveReactivePropsStacks.addEventListener('change', (e) => {
      chrome.storage.sync.set({
         saveReactivePropsStacks: saveReactivePropsStacks.checked
      });
   });
});

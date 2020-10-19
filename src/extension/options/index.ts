import { ExtenstionTabName, IExtensionOptions, loadOptions } from 'Extension/Utils/loadOptions';

function initUserTimingAPIToggler(options: IExtensionOptions): void {
   const userTimingAPIToggler = document.getElementsByName(
      'useUserTimingAPI'
   )[0] as HTMLInputElement;

   userTimingAPIToggler.checked = options.useUserTimingAPI;
   userTimingAPIToggler.addEventListener('change', (e) => {
      chrome.storage.sync.set({
         useUserTimingAPI: userTimingAPIToggler.checked
      });
   });
}

function initThemeChooser(options: IExtensionOptions): void {
   const themeChooser = document.getElementsByName(
      'themeChooser'
   )[0] as HTMLSelectElement;

   themeChooser.value = options.theme;
   themeChooser.addEventListener('change', () => {
      chrome.storage.sync.set({
         theme: themeChooser.value
      });
   });
}

function initReactivePropsStacksToggler(options: IExtensionOptions): void {
   const saveReactivePropsStacks = document.getElementsByName(
      'saveReactivePropsStacks'
   )[0] as HTMLInputElement;

   saveReactivePropsStacks.checked = options.saveReactivePropsStacks;
   saveReactivePropsStacks.addEventListener('change', (e) => {
      chrome.storage.sync.set({
         saveReactivePropsStacks: saveReactivePropsStacks.checked
      });
   });
}

function initTabsChoosers(options: IExtensionOptions): void {
   const tabsChoosers = document.getElementsByName('tabs') as NodeListOf<
      HTMLInputElement
      >;

   tabsChoosers.forEach((tabsChooser) => {
      tabsChooser.checked = options.tabs.includes(
         tabsChooser.id as ExtenstionTabName
      );
      tabsChooser.addEventListener('change', () => {
         if (tabsChooser.checked) {
            loadOptions(['tabs']).then((result) => {
               chrome.storage.sync.set({
                  tabs: [tabsChooser.id].concat(result.tabs)
               });
            });
         } else {
            loadOptions(['tabs']).then((result) => {
               const tabIndex = result.tabs.indexOf(
                  tabsChooser.id as ExtenstionTabName
               );
               if (tabIndex !== -1) {
                  const newTabs = result.tabs.slice();
                  newTabs.splice(tabIndex, 1);
                  chrome.storage.sync.set({
                     tabs: newTabs
                  });
               }
            });
         }
      });
   });
}

loadOptions().then((options) => {
   initUserTimingAPIToggler(options);
   initThemeChooser(options);
   initReactivePropsStacksToggler(options);
   initTabsChoosers(options);
});

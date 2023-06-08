export type ExtenstionTabName =
   | 'Elements'
   | 'Profiler'
   | 'Dependencies'
   | 'Debugging'
   | 'Focus';

export interface IExtensionOptions {
   useUserTimingAPI: boolean;
   theme: 'dark' | 'light' | 'devtools';
   tabs: ExtenstionTabName[];
   saveReactivePropsStacks: boolean;
}

export const DEFAULT_EXTENSION_OPTIONS: IExtensionOptions = {
   useUserTimingAPI: false,
   theme: 'devtools',
   tabs: ['Elements', 'Profiler', 'Dependencies', 'Debugging', 'Focus'],
   saveReactivePropsStacks: false
};

export function loadOptions(
   keys: Array<keyof IExtensionOptions> = Object.keys(
      DEFAULT_EXTENSION_OPTIONS
   ) as Array<keyof IExtensionOptions>
): Promise<IExtensionOptions> {
   return new Promise((resolve) => {
      const keysToGetWithDefaultValues: Record<string, unknown> = {};
      keys.forEach((key) => {
         keysToGetWithDefaultValues[key] = DEFAULT_EXTENSION_OPTIONS[key];
      });
      chrome.storage.sync.get(keysToGetWithDefaultValues, (result) => {
         resolve(result as IExtensionOptions);
      });
   });
}

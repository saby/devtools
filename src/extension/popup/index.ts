import Tab = chrome.tabs.Tab;

const selectFavoriteModules = document.getElementById(
   'selectFavoriteModules'
) as HTMLButtonElement;
const selectAllModules = document.getElementById(
   'selectAllModules'
) as HTMLButtonElement;
const resetAllModules = document.getElementById(
   'resetAllModules'
) as HTMLButtonElement;

selectFavoriteModules.addEventListener('click', () => {
   toggleFavoriteModules(true);
});

selectAllModules.addEventListener('click', () => {
   setCookie('true');
});

resetAllModules.addEventListener('click', () => {
   setCookie();
});

async function getCurrentTab(): Promise<Tab> {
   return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
         resolve(tab);
      });
   });
}

async function getPinnedModules(): Promise<string> {
   return new Promise((resolve) => {
      chrome.storage.sync.get(
         'debuggingPinnedModules',
         (result: { debuggingPinnedModules?: string[] }) => {
            resolve(result.debuggingPinnedModules?.join(',') ?? '');
         }
      );
   });
}

async function toggleFavoriteModules(state: boolean): Promise<void> {
   if (state) {
      const pinnedModules = await getPinnedModules();
      return setCookie(pinnedModules);
   } else {
      return setCookie();
   }
}

async function setCookie(value?: string): Promise<void> {
   const tab = await getCurrentTab();
   const url = new URL(tab.url as string).origin;
   const id = tab.id as number;
   if (value) {
      chrome.cookies.set(
         {
            name: 's3debug',
            url,
            value
         },
         () => {
            chrome.tabs.reload(id);
         }
      );
   } else {
      chrome.cookies.remove(
         {
            name: 's3debug',
            url
         },
         () => {
            chrome.tabs.reload(id);
         }
      );
   }
}

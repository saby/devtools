import { PANEL_NAME } from 'Extension/const';

let panelCreated: boolean = false;

const WASABY_INIT_TIMEOUT = 1000;

function createPanelIfNeeded(): void {
   if (panelCreated) {
      return;
   }
   chrome.devtools.inspectedWindow.eval(
      '!!window.__WASABY_DEV_HOOK__ && !!window.__WASABY_DEV_HOOK__._initialized',
      (initialized) => {
         if (initialized) {
            chrome.devtools.panels.create(
               PANEL_NAME,
               'devtool/icon.png',
               'devtool/app-index.html',
               (panel: chrome.devtools.panels.ExtensionPanel): void => {
                  panelCreated = true;
                  let elementsPanel: Window['elementsPanel'] | undefined;
                  let loadInterval: number;
                  let panelVisible = false;

                  function addLoadInterval(): void {
                     loadInterval = window.setInterval(() => {
                        if (window.elementsPanel) {
                           elementsPanel = window.elementsPanel;
                           elementsPanel.panelShownCallback();
                           window.clearInterval(loadInterval);
                        }
                     }, WASABY_INIT_TIMEOUT);
                  }

                  panel.onShown.addListener((window) => {
                     panelVisible = true;
                     if (window.elementsPanel) {
                        elementsPanel = window.elementsPanel;
                        elementsPanel.panelShownCallback();
                     } else {
                        addLoadInterval();
                     }
                  });
                  panel.onHidden.addListener(() => {
                     panelVisible = false;
                     if (elementsPanel) {
                        elementsPanel.panelHiddenCallback();
                     }
                     if (loadInterval) {
                        window.clearInterval(loadInterval);
                     }
                  });

                  chrome.devtools.network.onNavigated.addListener(() => {
                     elementsPanel = undefined;
                     if (panelVisible) {
                        addLoadInterval();
                     }
                  });
               }
            );
         }
      }
   );
}

createPanelIfNeeded();

if (!panelCreated) {
   const createPanelInterval = window.setInterval(() => {
      createPanelIfNeeded();
      if (panelCreated) {
         window.clearInterval(createPanelInterval);
      }
   }, WASABY_INIT_TIMEOUT);
}

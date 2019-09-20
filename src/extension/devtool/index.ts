import { PANEL_NAME } from 'Extension/const';

let panelCreated: boolean = false;

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
                  let elementsPanel: Window['elementsPanel'];
                  let loadInterval: number;
                  panel.onShown.addListener((window) => {
                     if (window.elementsPanel) {
                        elementsPanel = window.elementsPanel;
                        elementsPanel.panelShownCallback();
                     } else {
                        loadInterval = window.setInterval(() => {
                           if (window.elementsPanel) {
                              elementsPanel = window.elementsPanel;
                              elementsPanel.panelShownCallback();
                              window.clearInterval(loadInterval);
                           }
                        }, 1000);
                     }
                  });
                  panel.onHidden.addListener(() => {
                     if (elementsPanel) {
                        elementsPanel.panelHiddenCallback();
                     }
                     if (loadInterval) {
                        window.clearInterval(loadInterval);
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
   }, 1000);
}

import { PANEL_NAME } from 'Extension/const';

let panelCreated: boolean = false;

const WASABY_INIT_TIMEOUT = 1000;

function createPanelIfNeeded(): void {
   if (panelCreated) {
      return;
   }
   chrome.devtools.inspectedWindow.eval(
      '!!window.__WASABY_DEV_HOOK__ && !!window.__WASABY_DEV_HOOK__._$hasWasaby',
      (initialized) => {
         if (initialized) {
            chrome.devtools.panels.create(
               PANEL_NAME,
               'devtool/icon.png',
               'devtool/app-index.html',
               (panel: chrome.devtools.panels.ExtensionPanel): void => {
                  panelCreated = true;
                  let devtoolsPanel: Window['devtoolsPanel'] | undefined;
                  let loadInterval: number;
                  let panelVisible = false;

                  function addLoadInterval(devtoolsWindow: Window): void {
                     loadInterval = window.setInterval(() => {
                        if (devtoolsWindow.devtoolsPanel) {
                           devtoolsPanel = devtoolsWindow.devtoolsPanel;
                           devtoolsPanel.panelShownCallback();
                           window.clearInterval(loadInterval);
                        }
                     }, WASABY_INIT_TIMEOUT);
                  }

                  panel.onShown.addListener((devtoolsWindow) => {
                     panelVisible = true;
                     if (devtoolsWindow.devtoolsPanel) {
                        devtoolsPanel = devtoolsWindow.devtoolsPanel;
                        devtoolsPanel.panelShownCallback();
                     } else {
                        addLoadInterval(devtoolsWindow);
                     }
                  });
                  panel.onHidden.addListener(() => {
                     panelVisible = false;
                     if (devtoolsPanel) {
                        devtoolsPanel.panelHiddenCallback();
                     }
                     if (loadInterval) {
                        window.clearInterval(loadInterval);
                     }
                  });

                  chrome.devtools.network.onNavigated.addListener(() => {
                     devtoolsPanel = undefined;
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

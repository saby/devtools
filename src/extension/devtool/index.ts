import { PANEL_NAME } from 'Extension/const';

let panelCreated: boolean = false;

function createPanelIfNeeded(): void {
   if (panelCreated) {
      return;
   }
   //TODO: сейчас условие всегда будет эвалиться в true, но когда начнёт дёргаться init у хука, нужно будет поправить условие, чтобы оно смотрело именно на наличие фреймворка
   chrome.devtools.inspectedWindow.eval('!!window.__WASABY_DEV_HOOK__ ', () => {
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
   });
}

createPanelIfNeeded();

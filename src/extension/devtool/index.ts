import { PANEL_NAME } from 'Extension/const';

chrome.devtools.panels.create(PANEL_NAME,
    'devtool/icon.png',
    'devtool/app-index.html',
    function(panel: chrome.devtools.panels.ExtensionPanel) {
       let elementsPanel;
       let loadInterval: number;
       panel.onShown.addListener((window) => {
            if (window.elementsPanel) {
               elementsPanel = window.elementsPanel;
               elementsPanel.getSelectedItem();
            } else {
               loadInterval = window.setInterval(() => {
                  if (window.elementsPanel) {
                     elementsPanel = window.elementsPanel;
                     elementsPanel.getSelectedItem();
                     window.clearInterval(loadInterval);
                  }
               }, 1000);
            }
        });
        panel.onHidden.addListener(() => {
           if (elementsPanel) {
              elementsPanel.hideOverlay();
           }
        });
    }
);

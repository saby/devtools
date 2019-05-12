import { PANEL_NAME } from "Extension/const";

chrome.devtools.panels.create(PANEL_NAME,
    "devtool/icon.png",
    "devtool/app-index.html",
    function(panel: chrome.devtools.panels.ExtensionPanel) {
        // code invoked on panel creation
    }
);

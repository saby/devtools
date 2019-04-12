import { PANEL_NAME } from "../const";

chrome.devtools.panels.create(PANEL_NAME,
    "devtool/icon.png",
    "devtool/dependency/index.html",
    function(panel: chrome.devtools.panels.ExtensionPanel) {
        // code invoked on panel creation
    }
);

// // Create a connection to the background page
// var backgroundPageConnection = chrome.runtime.connect({
//     name: "devtools-page"
// });
// backgroundPageConnection.onMessage.addListener(function (message) {
//     // Handle responses from the background page, if any
// });
//
// // Relay the tab ID to the background page
// chrome.runtime.sendMessage({
//     tabId: chrome.devtools.inspectedWindow.tabId,
//     scriptToInject: "content_script.js"
// });


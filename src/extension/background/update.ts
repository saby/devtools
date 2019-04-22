import { UPDATE_MESSAGE } from "ExtensionCore/const";

chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
    if (details.reason === 'update') {
        console.info(UPDATE_MESSAGE);
    }
});

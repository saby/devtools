import { UPDATE_MESSAGE } from "Extension/const";

chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
    if (details.reason === 'update') {
        console.info(UPDATE_MESSAGE);
    }
});

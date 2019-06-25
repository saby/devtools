import {
    POST_MESSAGE_SOURCE,
    INJECTION_SCRIPT,
    DEVTOOL_CONTENT_PORT
} from 'Extension/const';
import { injectScript } from './injectScript';
import { createProxy } from './MessageProxy';
import { loadOptions, loadOptionsSync } from './loadOptions';

createProxy({
    portName: DEVTOOL_CONTENT_PORT,
    source: POST_MESSAGE_SOURCE
});
loadOptionsSync((options) => {
    injectScript({
        textContent: `this.wasabyDevtoolsOptions = ${JSON.stringify(options)}`
    });
    injectScript({
        fileName: INJECTION_SCRIPT
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
       if (areaName === 'sync') {
           loadOptions().then((options) => {
               injectScript({
                   textContent: `this.wasabyDevtoolsOptions = ${JSON.stringify(options)}`
               });
           });
       }
    });
});

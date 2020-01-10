import {
    POST_MESSAGE_SOURCE,
    INJECTION_SCRIPT,
    DEVTOOL_CONTENT_PORT
} from 'Extension/const';
import { injectScript } from './injectScript';
import { createProxy } from './MessageProxy';
import { loadOptions } from './loadOptions';

loadOptions().then((options) => {
    injectScript({
        textContent: `this.wasabyDevtoolsOptions = ${JSON.stringify(options)}`
    });
    injectScript({
        fileName: INJECTION_SCRIPT
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
       if (areaName === 'sync') {
           loadOptions().then((newOptions) => {
               injectScript({
                   textContent: `this.wasabyDevtoolsOptions = ${JSON.stringify(newOptions)}`
               });
           });
       }
    });
});

createProxy({
    portName: DEVTOOL_CONTENT_PORT,
    source: POST_MESSAGE_SOURCE
});

import {
    POST_MESSAGE_SOURCE,
    INJECTION_SCRIPT,
    DEVTOOL_CONTENT_PORT
} from 'ExtensionCore/const';
import { injectScript } from './injectScript';
import { createProxy } from './MessageProxy';

createProxy({
    portName: DEVTOOL_CONTENT_PORT,
    source: POST_MESSAGE_SOURCE
});
injectScript(INJECTION_SCRIPT);

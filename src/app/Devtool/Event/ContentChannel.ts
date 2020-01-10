import { DEVTOOL_CONTENT_PORT, PORT_TAB_ID_POSTFIX } from 'Extension/const';
import { PortChannel } from './PortChannel';

const port = chrome.runtime.connect({
   name: `${ DEVTOOL_CONTENT_PORT }${ PORT_TAB_ID_POSTFIX }${ chrome.devtools.inspectedWindow.tabId }`
});

class ContentChannel extends PortChannel {
   constructor(name: string) {
      super(name, port);
   }
}

export {
   ContentChannel
};

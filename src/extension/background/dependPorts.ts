import { createProxy } from "./proxyMessage";
import { PORT_TAB_ID_POSTFIX } from "ExtensionCore/const";

type TabId = string;
type PortName = string;

const enum PortType {
    content,
    devtool
}

type TabActivePorts = Map<TabId, Map<PortType, chrome.runtime.Port>>

let getReversePortType = (type: PortType): PortType => {
  switch (type) {
      case PortType.content: {
          return PortType.devtool;
      }
      case PortType.devtool: {
          return PortType.content;
      }
  }
};

let dependPorts = (portName: PortName) => {
    const ACTIVE_PORTS: TabActivePorts = new Map();
    
    let getOnDisconnect = (tabId: TabId, type: PortType) => {
        return (port) => {
            if(!ACTIVE_PORTS.has(tabId)) {
                return;
            }
            let activePorts = ACTIVE_PORTS.get(tabId);
            activePorts.delete(type);
            if (activePorts.size == 0) {
                ACTIVE_PORTS.delete(tabId);
            }
        }
    };
    
    chrome.runtime.onConnect.addListener((port: chrome.runtime.Port) => {
        if (!port.name.startsWith(portName)) {
            return;
        }
        let tabId: TabId;
        let type: PortType;
        
        if (port.name.includes(PORT_TAB_ID_POSTFIX)) {
            // when port was opened from devtool
            tabId = port.name.replace(`${portName}${PORT_TAB_ID_POSTFIX}`, '');
            type = PortType.devtool;
        } else {
            // when port was opened from content script
            tabId = String(port.sender.tab.id);
            type = PortType.content;
        }
    
        port.onDisconnect.addListener(getOnDisconnect(tabId, type));
        
        if (!ACTIVE_PORTS.has(tabId)) {
            ACTIVE_PORTS.set(tabId, new Map());
        }
        
        let activePorts = ACTIVE_PORTS.get(tabId);
    
        activePorts.set(type, port);
        
        if (activePorts.size <= 1) {
            return;
        }
        
        createProxy(port, activePorts.get(getReversePortType(type)));
    });
};

export { dependPorts }

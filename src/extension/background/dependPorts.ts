import { createProxy } from './proxyMessage';
import { PORT_TAB_ID_POSTFIX } from 'Extension/const';

type TabId = string;
type PortName = string;

enum PortType {
    content,
    devtool
}
type ActivePorts = Map<PortType, chrome.runtime.Port>;
type TabActivePorts = Map<TabId, ActivePorts>;

const getReversePortType = (type: PortType): PortType => {
  switch (type) {
      case PortType.content: {
          return PortType.devtool;
      }
      case PortType.devtool: {
          return PortType.content;
      }
  }
};

const dependPorts = (portName: PortName) => {
    const ACTIVE_PORTS: TabActivePorts = new Map();

    const getOnDisconnect = (tabId: TabId, type: PortType) => {
        return () => {
            if (!ACTIVE_PORTS.has(tabId)) {
                return;
            }
            const activePorts = ACTIVE_PORTS.get(tabId) as ActivePorts;
            activePorts.delete(type);
            if (activePorts.size === 0) {
                ACTIVE_PORTS.delete(tabId);
            }
        };
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

        const activePorts = ACTIVE_PORTS.get(tabId) as ActivePorts;

        activePorts.set(type, port);

        if (activePorts.size <= 1) {
            return;
        }

        createProxy(port, activePorts.get(getReversePortType(type)) as chrome.runtime.Port);
    });
};

export { dependPorts };

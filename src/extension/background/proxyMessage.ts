type MessageHandler = (message: MessageEvent) => void;
type DisconnectHandler = (port: chrome.runtime.Port) => void;

function getMessageProxy(port: chrome.runtime.Port): MessageHandler {
   return (message: MessageEvent) => {
      port.postMessage(message);
   };
}

function getOnDisconnect(
   dependentPort: chrome.runtime.Port,
   messageProxy: MessageHandler
): DisconnectHandler {
   return (port: chrome.runtime.Port) => {
      dependentPort.onMessage.removeListener(messageProxy);
   };
}

const createProxy = (
   port1: chrome.runtime.Port,
   port2: chrome.runtime.Port
) => {
   const proxyTo1: MessageHandler = getMessageProxy(port1);
   const proxyTo2: MessageHandler = getMessageProxy(port2);

   const onDisconnect1: DisconnectHandler = getOnDisconnect(port2, proxyTo1);
   const onDisconnect2: DisconnectHandler = getOnDisconnect(port1, proxyTo2);

   port1.onMessage.addListener(proxyTo2);
   port2.onMessage.addListener(proxyTo1);

   port1.onDisconnect.addListener(onDisconnect1);
   port2.onDisconnect.addListener(onDisconnect2);
};

export { createProxy };

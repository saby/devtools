const GLOBAL = (function() {
   if (typeof self !== 'undefined') {
      return self;
   }
   if (typeof window !== 'undefined') {
      return window;
   }
   if (typeof global !== 'undefined') {
      return global;
   }
   throw new Error('unable to locate global object');
})();

function getChromeEvent() {
   return {
      addListener(callback) {},
      hasListener(callback) {},
      removeListener(callback) {},
      hasListeners() {}
   }
}

GLOBAL.chrome = {
   runtime: {
      connect: function (connectInfo) {
         return {
            postMessage(message) {},
            disconnect() {},
            onDisconnect: getChromeEvent(),
            onMessage: getChromeEvent(),
            name: 'chromeRuntime'
         }
      }
   },
   devtools: {
      inspectedWindow: {
         tabId: 1,
         eval() {},
         reload() {}
      },
      panels: {
         openResource() {}
      }
   },
   cookies: {
      set() {},
      get() {},
      remove() {},
      getAll() {},
      onChanged: {
         addListener() {},
         removeListener() {}
      }
   },
   tabs: {
      get() {}
   },
   storage: {
      sync: {
         get() {},
         set() {}
      }
   }
};
